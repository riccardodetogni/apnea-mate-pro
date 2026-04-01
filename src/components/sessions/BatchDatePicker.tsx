import { useState, useEffect, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { X, CalendarDays, Repeat, Plus } from "lucide-react";
import { format, addDays, startOfWeek, addWeeks, isBefore, startOfDay } from "date-fns";
import { it } from "date-fns/locale";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export interface SelectedDate {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  index: number; // 0, 1, 2 — allows multiple entries per date
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

const WEEKDAY_LABELS: Record<number, string> = {
  1: "Lunedì",
  2: "Martedì",
  3: "Mercoledì",
  4: "Giovedì",
  5: "Venerdì",
  6: "Sabato",
  0: "Domenica",
};

const MAX_SLOTS_PER_DAY = 3;
const today = startOfDay(new Date());

const BatchDatePicker = ({ selectedDates, onDatesChange, defaultTime }: BatchDatePickerProps) => {
  const [tab, setTab] = useState<string>("pick");
  const [repeatDays, setRepeatDays] = useState<number[]>([]);
  const [repeatWeeks, setRepeatWeeks] = useState(4);
  const [repeatStartDate, setRepeatStartDate] = useState(
    format(addDays(new Date(), 1), "yyyy-MM-dd")
  );

  // Template for repeat mode: weekday -> time slots
  const [repeatTemplates, setRepeatTemplates] = useState<Record<number, string[]>>({});

  // Convert selectedDates to unique Date[] for calendar
  const calendarDates = useMemo(() => {
    const uniqueDates = [...new Set(selectedDates.map((d) => d.date))];
    return uniqueDates.map((d) => new Date(d + "T00:00:00"));
  }, [selectedDates]);

  // Group selectedDates by date for display
  const groupedByDate = useMemo(() => {
    const map = new Map<string, SelectedDate[]>();
    for (const sd of selectedDates) {
      const list = map.get(sd.date) || [];
      list.push(sd);
      map.set(sd.date, list);
    }
    return map;
  }, [selectedDates]);

  const handleCalendarSelect = (dates: Date[] | undefined) => {
    if (!dates) return;

    const newDateStrings = new Set(dates.map((d) => format(d, "yyyy-MM-dd")));

    // Keep existing entries for dates still selected, add new dates with index 0
    const kept = selectedDates.filter((sd) => newDateStrings.has(sd.date));
    const existingDateStrings = new Set(kept.map((sd) => sd.date));

    const added: SelectedDate[] = [];
    for (const dateStr of newDateStrings) {
      if (!existingDateStrings.has(dateStr)) {
        added.push({ date: dateStr, time: defaultTime || "09:00", index: 0 });
      }
    }

    const updated = [...kept, ...added].sort((a, b) =>
      a.date === b.date ? a.index - b.index : a.date.localeCompare(b.date)
    );
    onDatesChange(updated);
  };

  const handleAddSlot = (dateStr: string) => {
    const existing = selectedDates.filter((sd) => sd.date === dateStr);
    if (existing.length >= MAX_SLOTS_PER_DAY) return;
    const nextIndex = Math.max(...existing.map((sd) => sd.index)) + 1;
    const updated = [
      ...selectedDates,
      { date: dateStr, time: defaultTime || "09:00", index: nextIndex },
    ].sort((a, b) =>
      a.date === b.date ? a.index - b.index : a.date.localeCompare(b.date)
    );
    onDatesChange(updated);
  };

  const handleTimeChange = (dateStr: string, index: number, time: string) => {
    onDatesChange(
      selectedDates.map((sd) =>
        sd.date === dateStr && sd.index === index ? { ...sd, time } : sd
      )
    );
  };

  const handleRemoveSlot = (dateStr: string, index: number) => {
    const remaining = selectedDates.filter(
      (sd) => !(sd.date === dateStr && sd.index === index)
    );
    // If last slot for this date, remove all (calendar deselect)
    const dateStillHasSlots = remaining.some((sd) => sd.date === dateStr);
    onDatesChange(dateStillHasSlots ? remaining : remaining);
  };

  const handleRemoveDate = (dateStr: string) => {
    onDatesChange(selectedDates.filter((sd) => sd.date !== dateStr));
  };

  // --- Repeat mode ---

  // Initialize template when days change
  useEffect(() => {
    setRepeatTemplates((prev) => {
      const next = { ...prev };
      for (const day of repeatDays) {
        if (!next[day]) {
          next[day] = [defaultTime || "09:00"];
        }
      }
      // Remove templates for unchecked days
      for (const key of Object.keys(next)) {
        if (!repeatDays.includes(Number(key))) {
          delete next[Number(key)];
        }
      }
      return next;
    });
  }, [repeatDays, defaultTime]);

  // Generate dates from repeat templates
  useEffect(() => {
    if (tab !== "repeat" || repeatDays.length === 0) return;

    const start = new Date(repeatStartDate + "T00:00:00");
    const generated: SelectedDate[] = [];

    for (let week = 0; week < repeatWeeks; week++) {
      for (const dayOfWeek of repeatDays) {
        const weekStart = startOfWeek(addWeeks(start, week), { weekStartsOn: 1 });
        const targetDate = addDays(weekStart, dayOfWeek === 0 ? 6 : dayOfWeek - 1);

        if (isBefore(targetDate, today)) continue;

        const dateStr = format(targetDate, "yyyy-MM-dd");
        const times = repeatTemplates[dayOfWeek] || [defaultTime || "09:00"];

        times.forEach((time, idx) => {
          generated.push({ date: dateStr, time, index: idx });
        });
      }
    }

    generated.sort((a, b) =>
      a.date === b.date ? a.index - b.index : a.date.localeCompare(b.date)
    );
    // Deduplicate by date+index
    const unique = generated.filter(
      (d, i, arr) => i === 0 || d.date !== arr[i - 1].date || d.index !== arr[i - 1].index
    );
    onDatesChange(unique);
  }, [tab, repeatDays, repeatWeeks, repeatStartDate, repeatTemplates]);

  const toggleRepeatDay = (day: number) => {
    setRepeatDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleTemplateTimeChange = (day: number, slotIndex: number, time: string) => {
    setRepeatTemplates((prev) => {
      const slots = [...(prev[day] || [])];
      slots[slotIndex] = time;
      return { ...prev, [day]: slots };
    });
  };

  const handleTemplateAddSlot = (day: number) => {
    setRepeatTemplates((prev) => {
      const slots = prev[day] || [];
      if (slots.length >= MAX_SLOTS_PER_DAY) return prev;
      return { ...prev, [day]: [...slots, defaultTime || "09:00"] };
    });
  };

  const handleTemplateRemoveSlot = (day: number, slotIndex: number) => {
    setRepeatTemplates((prev) => {
      const slots = (prev[day] || []).filter((_, i) => i !== slotIndex);
      if (slots.length === 0) return { ...prev, [day]: [defaultTime || "09:00"] };
      return { ...prev, [day]: slots };
    });
  };

  // Count for repeat summary
  const repeatTotalSessions = useMemo(() => {
    if (tab !== "repeat") return 0;
    return selectedDates.length;
  }, [tab, selectedDates]);

  const repeatSlotsPerWeek = useMemo(() => {
    return repeatDays.reduce((sum, day) => sum + (repeatTemplates[day]?.length || 1), 0);
  }, [repeatDays, repeatTemplates]);

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

          {/* Weeks count & start */}
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

          {/* Template rows */}
          {repeatDays.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                {t("addTimeSlot")}
              </Label>
              <div className="space-y-1.5">
                {repeatDays
                  .sort((a, b) => {
                    const order = [1, 2, 3, 4, 5, 6, 0];
                    return order.indexOf(a) - order.indexOf(b);
                  })
                  .map((day) => {
                    const slots = repeatTemplates[day] || [defaultTime || "09:00"];
                    return (
                      <div key={day} className="p-2 rounded-lg bg-muted/50">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{WEEKDAY_LABELS[day]}</span>
                          {slots.length < MAX_SLOTS_PER_DAY && (
                            <button
                              type="button"
                              onClick={() => handleTemplateAddSlot(day)}
                              className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-primary/10 text-primary transition-colors"
                              title={t("addTimeSlot")}
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <div className="space-y-1">
                          {slots.map((time, slotIdx) => (
                            <div key={slotIdx} className="flex items-center gap-2">
                              <Input
                                type="time"
                                value={time}
                                onChange={(e) =>
                                  handleTemplateTimeChange(day, slotIdx, e.target.value)
                                }
                                className="w-24 h-8 text-xs"
                              />
                              {slots.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleTemplateRemoveSlot(day, slotIdx)}
                                  className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
              {/* Summary */}
              {repeatTotalSessions > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  {repeatTotalSessions} {t("sessionsWillBeCreated")} ({repeatWeeks} sett. × {repeatSlotsPerWeek}/sett.)
                </p>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Selected dates list — only in pick mode */}
      {tab === "pick" && selectedDates.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            {selectedDates.length} {selectedDates.length === 1 ? "sessione" : "sessioni"}
          </Label>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {[...groupedByDate.entries()].map(([dateStr, slots]) => (
              <div key={dateStr} className="p-2 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium">
                      {format(new Date(dateStr + "T00:00:00"), "EEE d MMM", { locale: it })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {slots.length < MAX_SLOTS_PER_DAY && (
                      <button
                        type="button"
                        onClick={() => handleAddSlot(dateStr)}
                        className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-primary/10 text-primary transition-colors"
                        title={t("addTimeSlot")}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveDate(dateStr)}
                      className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  {slots.map((sd) => (
                    <div key={`${sd.date}-${sd.index}`} className="flex items-center gap-2 pl-5">
                      <Input
                        type="time"
                        value={sd.time}
                        onChange={(e) => handleTimeChange(sd.date, sd.index, e.target.value)}
                        className="w-24 h-8 text-xs"
                      />
                      {slots.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSlot(sd.date, sd.index)}
                          className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchDatePicker;
