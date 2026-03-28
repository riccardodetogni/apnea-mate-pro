import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface NominatimResult {
  display_name: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    state?: string;
    country?: string;
  };
}

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
}

const formatResult = (result: NominatimResult): string => {
  const addr = result.address;
  if (!addr) return result.display_name;
  const city = addr.city || addr.town || addr.village || addr.municipality || "";
  const region = addr.state || addr.county || "";
  if (city && region) return `${city}, ${region}`;
  if (city) return city;
  if (region) return region;
  return result.display_name.split(",").slice(0, 2).join(",").trim();
};

export const LocationAutocomplete = ({
  value,
  onChange,
  placeholder = "Milano, Lombardia",
  id = "location",
}: LocationAutocompleteProps) => {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync external value changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Debounced search
  useEffect(() => {
    if (query.length < 3 || query === value) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&accept-language=it&addressdetails=1&limit=5`
        );
        const data: NominatimResult[] = await res.json();
        setResults(data);
        setOpen(data.length > 0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, value]);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (result: NominatimResult) => {
    const formatted = formatResult(result);
    setQuery(formatted);
    onChange(formatted);
    setOpen(false);
    setResults([]);
  };

  return (
    <div ref={containerRef} className="relative flex-1">
      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted z-10" />
      {loading && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted animate-spin z-10" />
      )}
      <Input
        id={id}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          if (e.target.value !== value) {
            // Don't call onChange until selection
          }
        }}
        onFocus={() => {
          if (results.length > 0) setOpen(true);
        }}
        placeholder={placeholder}
        className="rounded-xl h-12 pl-10"
        autoComplete="off"
      />
      {open && results.length > 0 && (
        <ul className="absolute z-50 top-full mt-1 w-full bg-card border border-border rounded-xl shadow-lg overflow-hidden">
          {results.map((result, i) => (
            <li
              key={i}
              className="px-4 py-3 text-sm cursor-pointer hover:bg-accent/20 flex items-center gap-2 text-card-foreground"
              onMouseDown={() => handleSelect(result)}
            >
              <MapPin className="w-4 h-4 text-muted flex-shrink-0" />
              {formatResult(result)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
