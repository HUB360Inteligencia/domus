
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  className?: string;
  description?: string;
  iconColor?: string;
}

export function StatsCard({ 
  title, 
  value, 
  icon, 
  trend, 
  trendDirection = 'neutral',
  className,
  description,
  iconColor
}: StatsCardProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
        <CardTitle className="text-xs font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn("h-4 w-4 text-muted-foreground", iconColor)}>
          {icon}
        </div>
      </CardHeader>
      <CardContent className="pt-1">
        <div className="text-lg font-bold">{value}</div>
        {trend && (
          <p className={cn(
            "text-xs",
            trendDirection === 'up' && "text-green-600",
            trendDirection === 'down' && "text-red-600",
            trendDirection === 'neutral' && "text-muted-foreground"
          )}>
            {trend}
          </p>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
