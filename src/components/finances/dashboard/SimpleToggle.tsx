
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
      className={cn('bg-gray-100 p-1 rounded-md h-9', className)}
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          className="text-xs px-2 py-1 data-[state=on]:bg-white data-[state=on]:shadow-sm"
        >
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
