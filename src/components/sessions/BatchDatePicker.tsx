import { useState, useEffect, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { X, CalendarDays, Repeat } from "lucide-react";
import { format, addDays, startOfWeek, addWeeks, isBefore, startOfDay } from "date-fns";
import { it } from "date-fns/locale";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export interface SelectedDate {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
}

interface BatchDatePickerProps {
  selectedDates: SelectedDate[];
  onDatesChange: (dates: SelectedDate[]) => void;
  defaultTime: string;
}

const WEEKDAYS = [
  { key: 1, label: "Lun" },
  { key: 2, label: "Mar" },
  { key: 3, label: "Mer" },
  { key: 4, label: "Gio" },
  { key: 5, label: "Ven" },
  { key: 6, label: "Sab" },
  { key: 0, label: "Dom" },
];

const today = startOfDay(new Date());

const BatchDatePicker = ({ selectedDates, onDatesChange, defaultTime }: BatchDatePickerProps) => {
  const [tab, setTab] = useState<string>("pick");
  const [repeatDays, setRepeatDays] = useState<number[]>([]);
  const [repeatWeeks, setRepeatWeeks] = useState(4);
  const [repeatStartDate, setRepeatStartDate] = useState(
    format(addDays(new Date(), 1), "yyyy-MM-dd")
  );

  // Convert selectedDates to Date[] for calendar
  const calendarDates = useMemo(
    () => selectedDates.map((d) => new Date(d.date + "T00:00:00")),
    [selectedDates]
  );

  const handleCalendarSelect = (dates: Date[] | undefined) => {
    if (!dates) return;
    
    const newDateStrings = dates.map((d) => format(d, "yyyy-MM-dd"));
    const existingMap = new Map(selectedDates.map((sd) => [sd.date, sd.time]));
    
    const updated: SelectedDate[] = newDateStrings
      .sort()
      .map((dateStr) => ({
        date: dateStr,
        time: existingMap.get(dateStr) || defaultTime || "09:00",
      }));

    onDatesChange(updated);
  };

  // Generate dates from recurrence pattern
  useEffect(() => {
    if (tab !== "repeat" || repeatDays.length === 0) return;

    const start = new Date(repeatStartDate + "T00:00:00");
    const generated: SelectedDate[] = [];

    for (let week = 0; week < repeatWeeks; week++) {
      for (const dayOfWeek of repeatDays) {
        // Calculate the date for this weekday in this week
        const weekStart = startOfWeek(addWeeks(start, week), { weekStartsOn: 1 });
        let targetDate = addDays(weekStart, dayOfWeek === 0 ? 6 : dayOfWeek - 1);
        
        if (isBefore(targetDate, today)) continue;
        
        const dateStr = format(targetDate, "yyyy-MM-dd");
        const existingTime = selectedDates.find((sd) => sd.date === dateStr)?.time;
        generated.push({
          date: dateStr,
          time: existingTime || defaultTime || "09:00",
        });
      }
    }

    generated.sort((a, b) => a.date.localeCompare(b.date));
    // Deduplicate
    const unique = generated.filter(
      (d, i, arr) => i === 0 || d.date !== arr[i - 1].date
    );
    onDatesChange(unique);
  }, [tab, repeatDays, repeatWeeks, repeatStartDate]);

  const handleTimeChange = (dateStr: string, time: string) => {
    onDatesChange(
      selectedDates.map((sd) => (sd.date === dateStr ? { ...sd, time } : sd))
    );
  };

  const handleRemoveDate = (dateStr: string) => {
    onDatesChange(selectedDates.filter((sd) => sd.date !== dateStr));
  };

  const toggleRepeatDay = (day: number) => {
    setRepeatDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full">
          <TabsTrigger value="pick" className="flex-1 gap-1.5">
            <CalendarDays className="w-3.5 h-3.5" />
            {t("pickDates")}
          </TabsTrigger>
          <TabsTrigger value="repeat" className="flex-1 gap-1.5">
            <Repeat className="w-3.5 h-3.5" />
            {t("repeatPattern")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pick" className="mt-3">
          <div className="flex justify-center">
            <Calendar
              mode="multiple"
              selected={calendarDates}
              onSelect={handleCalendarSelect}
              disabled={(date) => isBefore(date, today)}
              className="rounded-md border pointer-events-auto"
              locale={it}
            />
          </div>
        </TabsContent>

        <TabsContent value="repeat" className="mt-3 space-y-4">
          {/* Weekday checkboxes */}
          <div className="space-y-2">
            <Label>{t("repeatEvery")}</Label>
            <div className="flex gap-1.5 flex-wrap">
              {WEEKDAYS.map((day) => (
                <button
                  key={day.key}
                  type="button"
                  onClick={() => toggleRepeatDay(day.key)}
                  className={cn(
                    "w-10 h-10 rounded-full text-xs font-medium transition-colors border",
                    repeatDays.includes(day.key)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-border hover:bg-muted"
                  )}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          {/* Weeks count */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t("forWeeks")}</Label>
              <Input
                type="number"
                min={1}
                max={12}
                value={repeatWeeks}
                onChange={(e) =>
                  setRepeatWeeks(Math.min(12, Math.max(1, parseInt(e.target.value) || 1)))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Da</Label>
              <Input
                type="date"
                value={repeatStartDate}
                onChange={(e) => setRepeatStartDate(e.target.value)}
                min={format(today, "yyyy-MM-dd")}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Selected dates list */}
      {selectedDates.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            {selectedDates.length} {selectedDates.length === 1 ? "data selezionata" : "date selezionate"}
          </Label>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {selectedDates.map((sd) => (
              <div
                key={sd.date}
                className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-sm"
              >
                <CalendarDays className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="flex-1 font-medium">
                  {format(new Date(sd.date + "T00:00:00"), "EEE d MMM", { locale: it })}
                </span>
                <Input
                  type="time"
                  value={sd.time}
                  onChange={(e) => handleTimeChange(sd.date, e.target.value)}
                  className="w-24 h-8 text-xs"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveDate(sd.date)}
                  className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchDatePicker;
