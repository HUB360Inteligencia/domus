
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MinimalCardProps {
  children: React.ReactNode;
  className?: string;
  cols?: 1 | 2 | 3 | 4 | 5 | 6;
}

export function MinimalCard({ children, className, cols = 1 }: MinimalCardProps) {
  const colSpanClass = {
    1: 'col-span-1',
    2: 'col-span-2 lg:col-span-2',
    3: 'col-span-3 lg:col-span-3',
    4: 'col-span-4 lg:col-span-4',
    5: 'col-span-5 lg:col-span-5',
    6: 'col-span-6 lg:col-span-6'
  };

  return (
    <Card className={cn(
      'border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-white',
      colSpanClass[cols],
      className
    )}>
      <CardContent className="p-6">
        {children}
      </CardContent>
    </Card>
  );
}
