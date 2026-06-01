
import React from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

interface SimpleToggleProps {
  value: string;
  onValueChange: (value: string) => void;
  options: Array<{
    value: string;
    label: string;
  }>;
  className?: string;
}

export function SimpleToggle({ value, onValueChange, options, className }: SimpleToggleProps) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(val) => val && onValueChange(val)}
      className={cn('h-9 rounded-2xl bg-secondary/70 p-1', className)}
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          className="rounded-xl px-2 py-1 text-xs transition-all data-[state=on]:bg-white data-[state=on]:shadow-sm dark:data-[state=on]:bg-white/12"
        >
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
