
import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DateRange } from "react-day-picker";

export interface DatePickerProps {
  date: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  disabled?: boolean;
  defaultMonth?: Date;
  selected?: Date;
  mode?: "single" | "range" | "multiple";
}

export function DatePicker({
  date,
  onSelect,
  disabled,
  defaultMonth,
  selected,
  mode = "single",
}: DatePickerProps) {
  // Handler for range selection
  const handleRangeSelect = (range: DateRange | undefined) => {
    // For range mode, we'll use the from date
    if (range?.from) {
      onSelect(range.from);
    } else {
      onSelect(undefined);
    }
  };

  // Handler for multiple selection
  const handleMultipleSelect = (dates: Date[] | undefined) => {
    // For multiple mode, we'll use the first date
    if (dates && dates.length > 0) {
      onSelect(dates[0]);
    } else {
      onSelect(undefined);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PP") : <span>Selecione uma data</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        {mode === "single" && (
          <Calendar
            mode="single"
            selected={selected || date}
            onSelect={onSelect}
            defaultMonth={defaultMonth || date}
            initialFocus
            disabled={disabled}
            className="p-3 pointer-events-auto"
          />
        )}
        {mode === "range" && (
          <Calendar
            mode="range"
            selected={{ from: selected || date, to: selected || date }}
            onSelect={handleRangeSelect}
            defaultMonth={defaultMonth || date}
            initialFocus
            disabled={disabled}
            className="p-3 pointer-events-auto"
          />
        )}
        {mode === "multiple" && (
          <Calendar
            mode="multiple"
            selected={selected || date ? [selected || date] : []}
            onSelect={handleMultipleSelect}
            defaultMonth={defaultMonth || date}
            initialFocus
            disabled={disabled}
            className="p-3 pointer-events-auto"
          />
        )}
      </PopoverContent>
    </Popover>
  );
}
