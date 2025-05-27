
import React from 'react';
import { cn } from '@/lib/utils';

interface MetricWidgetProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
}

export function MetricWidget({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  className
}: MetricWidgetProps) {
  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600 font-medium">{title}</span>
        {icon && (
          <div className="h-4 w-4 text-gray-400">
            {icon}
          </div>
        )}
      </div>
      
      <div className="text-xl font-bold text-gray-900">
        {value}
      </div>
      
      {subtitle && (
        <div className="text-xs text-gray-500">
          {subtitle}
        </div>
      )}
      
      {trend && trendValue && (
        <div className={cn('text-xs font-medium', getTrendColor())}>
          {trendValue}
        </div>
      )}
    </div>
  );
}
