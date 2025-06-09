
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface DashboardKPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  sparklineData?: number[];
  className?: string;
  variant?: 'white' | 'gray' | 'slate';
}

export function DashboardKPICard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  sparklineData,
  className,
  variant = 'white'
}: DashboardKPICardProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'gray':
        return 'bg-gray-50 border-gray-100';
      case 'slate':
        return 'bg-slate-50 border-slate-100';
      default:
        return 'bg-white border-gray-200';
    }
  };

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
    <Card className={cn(
      'shadow-sm hover:shadow-md transition-all duration-200 h-32',
      getVariantClasses(),
      className
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <span className="text-xs font-medium text-gray-600">{title}</span>
          {icon && (
            <div className="h-4 w-4 text-gray-400">
              {icon}
            </div>
          )}
        </div>
        
        <div className="mb-1">
          <div className="text-xl font-bold text-gray-900 leading-tight">
            {value}
          </div>
          {subtitle && (
            <div className="text-xs text-gray-500">
              {subtitle}
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          {trend && trendValue && (
            <div className={cn('text-xs font-medium', getTrendColor())}>
              {trendValue}
            </div>
          )}
          
          {sparklineData && sparklineData.length > 0 && (
            <div className="flex items-end space-x-0.5 h-6">
              {sparklineData.slice(-8).map((value, index) => {
                const max = Math.max(...sparklineData);
                const height = Math.max((value / max) * 24, 2);
                return (
                  <div
                    key={index}
                    className="w-1 bg-blue-500 rounded-sm opacity-60"
                    style={{ height: `${height}px` }}
                  />
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
