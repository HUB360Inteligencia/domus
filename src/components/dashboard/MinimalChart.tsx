
import React from 'react';
import { ChartContainer } from '@/components/ui/chart';
import { cn } from '@/lib/utils';

interface MinimalChartProps {
  children: React.ReactElement;
  config: any;
  className?: string;
  height?: string;
}

export function MinimalChart({ 
  children, 
  config, 
  className,
  height = "h-48"
}: MinimalChartProps) {
  return (
    <div className={cn("w-full", height, className)}>
      <ChartContainer config={config} className="h-full w-full">
        {children}
      </ChartContainer>
    </div>
  );
}
