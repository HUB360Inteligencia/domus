
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
  icon?: ReactNode; // Add icon prop
}

export function PageHeader({ title, description, children, className, icon }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4", className)}>
      <div className="flex items-center gap-2">
        {icon && <div className="text-muted-foreground">{icon}</div>}
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
      </div>
      {children && <div>{children}</div>}
    </div>
  );
}
