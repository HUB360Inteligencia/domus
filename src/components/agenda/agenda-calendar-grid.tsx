import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AgendaEvent } from "@/types/agenda";
import { getAgendaEventTone } from "./agenda-utils";

interface AgendaCalendarGridProps {
  month: Date;
  selectedDate: Date;
  eventsByDay: Record<string, AgendaEvent[]>;
  onMonthChange: (date: Date) => void;
  onSelectDate: (date: Date) => void;
}

const weekLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

export function AgendaCalendarGrid({
  month,
  selectedDate,
  eventsByDay,
  onMonthChange,
  onSelectDate,
}: AgendaCalendarGridProps) {
  const calendarStart = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  return (
    <section className="premium-panel dark:premium-panel-dark min-w-0 rounded-2xl p-3 shadow-sm md:p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase text-accent">Calendario</div>
          <h2 className="mt-1 text-xl font-semibold capitalize text-foreground">
            {format(month, "MMMM yyyy", { locale: ptBR })}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl" onClick={() => onMonthChange(subMonths(month, 1))}>
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Mes anterior</span>
          </Button>
          <Button variant="outline" className="h-10 rounded-xl px-3" onClick={() => onMonthChange(new Date())}>
            <CalendarDays className="h-4 w-4" />
            Hoje
          </Button>
          <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl" onClick={() => onMonthChange(addMonths(month, 1))}>
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Proximo mes</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:gap-1.5 sm:text-xs">
        {weekLabels.map((label) => (
          <div key={label} className="py-1.5">
            <span className="sm:hidden">{label.charAt(0)}</span>
            <span className="hidden sm:inline">{label}</span>
          </div>
        ))}
      </div>

      <div className="mt-1 grid auto-rows-fr grid-cols-7 gap-1 sm:gap-1.5">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayEvents = eventsByDay[key] || [];
          const visibleEvents = dayEvents.slice(0, 3);
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());
          const inMonth = isSameMonth(day, month);

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDate(day)}
              aria-pressed={isSelected}
              className={cn(
                "flex min-h-[58px] min-w-0 flex-col rounded-xl border p-1 text-left transition-all sm:min-h-[112px] sm:p-2",
                "border-border/40 bg-white/55 hover:border-border hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
                !inMonth && "opacity-40",
                isSelected && "border-accent bg-accent/10 ring-2 ring-accent/40",
              )}
            >
              <div className="flex items-center justify-between gap-1">
                <span
                  className={cn(
                    "grid h-6 w-6 place-items-center rounded-full text-[11px] font-semibold tabular-nums sm:h-7 sm:w-7 sm:text-xs",
                    !isToday && !isSelected && "text-foreground",
                    isToday && "bg-primary text-primary-foreground",
                    isSelected && !isToday && "bg-accent text-accent-foreground",
                    isSelected && isToday && "ring-2 ring-accent ring-offset-1 ring-offset-background",
                  )}
                >
                  {format(day, "d")}
                </span>
                {dayEvents.length > 0 && (
                  <span className="hidden rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground sm:inline">
                    {dayEvents.length}
                  </span>
                )}
              </div>

              {/* Compact dot row for narrow screens */}
              {dayEvents.length > 0 && (
                <div className="mt-1 flex flex-wrap items-center gap-0.5 sm:hidden">
                  {visibleEvents.map((event) => (
                    <span key={event.id} className={cn("h-1.5 w-1.5 rounded-full", getAgendaEventTone(event).dot)} />
                  ))}
                  {dayEvents.length > visibleEvents.length && (
                    <span className="text-[9px] font-semibold leading-none text-muted-foreground">+</span>
                  )}
                </div>
              )}

              {/* Full event chips for sm+ */}
              <div className="mt-1.5 hidden min-w-0 flex-1 flex-col gap-1 overflow-hidden sm:flex">
                {visibleEvents.map((event) => {
                  const tone = getAgendaEventTone(event);
                  return (
                    <div key={event.id} className="flex min-w-0 items-center gap-1 rounded-md bg-background/75 px-1.5 py-1">
                      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", tone.dot)} />
                      <span className="truncate text-[11px] font-medium text-foreground">{event.title}</span>
                    </div>
                  );
                })}
                {dayEvents.length > visibleEvents.length && (
                  <div className="truncate px-1.5 text-[10px] font-medium text-muted-foreground">
                    +{dayEvents.length - visibleEvents.length} eventos
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
