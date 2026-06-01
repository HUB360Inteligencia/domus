import React, { useState } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowRight, Calendar, Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SimpleToggle } from "@/components/finances/dashboard/SimpleToggle";
import { useActivities } from "@/hooks/use-activities";

export function CompactActivitiesWidget() {
  const [viewMode, setViewMode] = useState<"upcoming" | "pending">("upcoming");
  const { activities, isLoadingActivities } = useActivities();

  const viewOptions = [
    { value: "upcoming", label: "Proximas" },
    { value: "pending", label: "Pendentes" },
  ];

  const upcomingActivities = React.useMemo(() => {
    if (!activities) return [];

    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return activities
      .filter((activity) => {
        if (!activity.due_date) return false;
        const dueDate = new Date(activity.due_date);
        return dueDate >= now && dueDate <= nextWeek && activity.status !== "completed";
      })
      .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
      .slice(0, 5);
  }, [activities]);

  const pendingActivities = React.useMemo(() => {
    if (!activities) return [];

    return activities
      .filter((activity) => activity.status === "pending")
      .sort((a, b) => {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      })
      .slice(0, 5);
  }, [activities]);

  const displayActivities = viewMode === "upcoming" ? upcomingActivities : pendingActivities;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-rose-700 bg-rose-100";
      case "medium":
        return "text-amber-800 bg-amber-100";
      case "low":
        return "text-emerald-700 bg-emerald-100";
      default:
        return "text-muted-foreground bg-secondary";
    }
  };

  if (isLoadingActivities) {
    return (
      <Card className="premium-panel dark:premium-panel-dark h-full min-h-[360px] rounded-[2.5rem]">
        <CardContent className="p-5">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Atividades</h3>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="h-14 animate-pulse rounded-2xl bg-secondary/70" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="premium-panel dark:premium-panel-dark h-full min-h-[360px] rounded-[2.5rem]">
      <CardContent className="flex h-full flex-col p-5">
        <div className="mb-4 flex flex-shrink-0 items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase text-accent">Agenda</p>
            <h3 className="mt-1 text-lg font-semibold text-foreground">Atividades</h3>
          </div>
          <div className="flex items-center gap-2">
            <SimpleToggle
              value={viewMode}
              onValueChange={(value) => setViewMode(value as "upcoming" | "pending")}
              options={viewOptions}
              className="h-9 rounded-2xl bg-white/60 p-1 text-xs dark:bg-white/5"
            />
            <Button size="sm" className="h-9 w-9 rounded-2xl p-0" aria-label="Nova atividade" asChild>
              <Link to="/activities/new">
                <Plus className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
          {displayActivities.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
              <Calendar className="mb-3 h-10 w-10 opacity-50" />
              <p className="text-center text-sm">
                {viewMode === "upcoming" ? "Nenhuma atividade proxima" : "Nenhuma atividade pendente"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {displayActivities.map((activity) => (
                <Link
                  key={activity.id}
                  to={`/activities/${activity.id}`}
                  className="flex w-full cursor-pointer items-center justify-between rounded-3xl border border-white/60 bg-white/55 px-3 py-3 text-left transition-[background-color,border-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-white/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 dark:border-white/10 dark:bg-white/5"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-2xl text-xs font-bold ${getPriorityColor(activity.priority)}`}>
                      {activity.priority === "high" ? "!" : activity.priority === "medium" ? "*" : "."}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 truncate text-sm font-medium text-foreground">{activity.title}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {activity.due_date && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              {formatDistanceToNow(new Date(activity.due_date), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </span>
                          </span>
                        )}
                        <span className="text-muted-foreground/50">/</span>
                        <span>{activity.activity_type}</span>
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 flex-shrink-0 border-t border-border/70 pt-3">
          <Button variant="ghost" size="sm" className="h-9 w-full text-xs" asChild>
            <Link to="/activities">
              Ver todas as atividades
              <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
