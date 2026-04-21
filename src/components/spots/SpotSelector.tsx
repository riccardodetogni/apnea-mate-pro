import { useState, useMemo } from "react";
import { MapPin, Search, Map, List, Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Spot } from "@/hooks/useSpots";
import SpotMap from "./SpotMap";
import SpotCreator from "./SpotCreator";
interface SpotSelectorProps {
  spots: Spot[];
  selectedSpotId: string;
  onSelect: (spotId: string) => void;
  loading?: boolean;
  onSpotCreated?: () => void;
}

const SpotSelector = ({
  spots,
  selectedSpotId,
  onSelect,
  loading = false,
  onSpotCreated,
}: SpotSelectorProps) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showCreator, setShowCreator] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedSpot = useMemo(
    () => spots.find((s) => s.id === selectedSpotId),
    [spots, selectedSpotId]
  );

  const filteredSpots = useMemo(() => {
    if (!searchQuery.trim()) return spots;
    const query = searchQuery.toLowerCase();
    return spots.filter(
      (spot) =>
        spot.name.toLowerCase().includes(query) ||
        spot.location.toLowerCase().includes(query) ||
        spot.environment_type.toLowerCase().includes(query)
    );
  }, [spots, searchQuery]);

  const handleSelectFromMap = (spotId: string) => {
    onSelect(spotId);
    setShowMap(false);
  };

  const handleSpotCreated = async (spotId: string) => {
    // Refresh the spots cache so the newly created spot appears in the list
    // and the selector can display its name/location immediately.
    await queryClient.invalidateQueries({ queryKey: ["spots"] });
    onSelect(spotId);
    setShowCreator(false);
    onSpotCreated?.();
  };

  if (showCreator) {
    return (
      <SpotCreator
        onSpotCreated={handleSpotCreated}
        onCancel={() => setShowCreator(false)}
      />
    );
  }

  if (showMap) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Seleziona sulla mappa</span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowCreator(true)}
              className="gap-1"
            >
              <Plus className="w-4 h-4" />
              Nuovo
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowMap(false)}
              className="gap-2"
            >
              <List className="w-4 h-4" />
              Lista
            </Button>
          </div>
        </div>
        <div className="relative">
          <div className="absolute top-2 left-2 right-2 z-[1000]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cerca spot..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background/95 backdrop-blur-sm"
              />
            </div>
          </div>
          <SpotMap
            spots={filteredSpots}
            selectedSpotId={selectedSpotId}
            onSelectSpot={handleSelectFromMap}
          />
        </div>
        {selectedSpot && (
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{selectedSpot.name}</span>
            <span className="text-sm text-muted-foreground">· {selectedSpot.location}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="flex-1 justify-start font-normal h-10"
            >
              {selectedSpot ? (
                <span className="flex items-center gap-2 truncate">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span className="truncate">{selectedSpot.name}</span>
                  <span className="text-muted-foreground truncate">· {selectedSpot.location}</span>
                </span>
              ) : (
                <span className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  Seleziona uno spot
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
            <Command>
              <CommandInput placeholder="Cerca spot..." />
              <CommandList>
                <CommandEmpty>
                  {loading ? "Caricamento..." : "Nessuno spot trovato"}
                </CommandEmpty>
                <CommandGroup>
                  {spots.map((spot) => (
                    <CommandItem
                      key={spot.id}
                      value={`${spot.name} ${spot.location}`}
                      onSelect={() => {
                        onSelect(spot.id);
                        setOpen(false);
                      }}
                      className="cursor-pointer"
                    >
                      <MapPin
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedSpotId === spot.id
                            ? "text-primary"
                            : "text-muted-foreground"
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="font-medium">{spot.name}</span>
                        <span className="text-muted-foreground ml-1">
                          · {spot.location}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground capitalize">
                        {spot.environment_type.replace("_", " ")}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setShowMap(true)}
          className="shrink-0"
          title="Mostra mappa"
        >
          <Map className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setShowCreator(true)}
          className="shrink-0"
          title="Aggiungi spot"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default SpotSelector;
