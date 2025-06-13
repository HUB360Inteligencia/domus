
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface HorizontalBarItem {
  name: string;
  value: number;
  percentage?: number;
  color?: string;
}

interface HorizontalBarChartProps {
  data: HorizontalBarItem[];
  title: string;
  subtitle?: string;
  isLoading?: boolean;
  variant?: 'white' | 'gray' | 'slate';
  valueFormatter?: (value: number) => string;
}

export function HorizontalBarChart({
  data,
  title,
  subtitle,
  isLoading,
  variant = 'slate',
  valueFormatter = (value) => value.toString()
}: HorizontalBarChartProps) {
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

  if (isLoading) {
    return (
      <Card className={`shadow-sm h-48 ${getVariantClasses()}`}>
        <CardContent className="p-4 h-full flex flex-col">
          <h3 className="text-sm font-semibold text-gray-900 mb-1 truncate">{title}</h3>
          {subtitle && <p className="text-xs text-gray-600 mb-3 truncate">{subtitle}</p>}
          <div className="space-y-2 flex-1 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse bg-gray-200 h-6 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxValue = Math.max(...data.map(item => item.value));

  return (
    <Card className={cn(
      'shadow-sm hover:shadow-md transition-shadow h-48',
      getVariantClasses()
    )}>
      <CardContent className="p-4 h-full flex flex-col">
        <div className="mb-3 flex-shrink-0">
          <h3 className="text-sm font-semibold text-gray-900 mb-1 truncate" title={title}>
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-gray-600 truncate" title={subtitle}>
              {subtitle}
            </p>
          )}
        </div>
        
        <div className="space-y-2 flex-1 overflow-hidden min-h-0">
          {data.slice(0, 4).map((item, index) => {
            const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
            
            return (
              <div key={item.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs min-h-0">
                  <span 
                    className="text-gray-700 truncate flex-1 mr-2 max-w-[100px]" 
                    title={item.name}
                  >
                    {item.name}
                  </span>
                  <span className="text-gray-900 font-medium whitespace-nowrap flex-shrink-0">
                    {valueFormatter(item.value)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full transition-all duration-300"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: item.color || '#0A5B6C'
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
