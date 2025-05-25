
import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, children, icon, className }: PageHeaderProps) {
  return (
    <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 ${className || ''}`}>
      <div className="flex items-center gap-3">
        {icon && <div className="text-primary">{icon}</div>}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-2">{description}</p>
          )}
        </div>
      </div>
      {children && (
        <div className="flex gap-2">
          {children}
        </div>
      )}
    </div>
  );
}
