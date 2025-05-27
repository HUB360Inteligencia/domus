
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MinimalCardProps {
  children: React.ReactNode;
  className?: string;
  cols?: 1 | 2 | 3 | 4 | 5 | 6;
}

export function MinimalCard({ children, className, cols = 1 }: MinimalCardProps) {
  return (
    <Card className={cn(
      'border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-white h-full min-h-[300px]',
      className
    )}>
      <CardContent className="p-6 h-full">
        {children}
      </CardContent>
    </Card>
  );
}
