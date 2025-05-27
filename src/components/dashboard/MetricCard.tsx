
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  colorScheme?: 'blue' | 'green' | 'red' | 'purple' | 'orange';
  size?: 'default' | 'large';
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  colorScheme = 'blue',
  size = 'default'
}: MetricCardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-600" />;
      default:
        return <Minus className="h-3 w-3 text-gray-500" />;
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

  const getColorScheme = () => {
    switch (colorScheme) {
      case 'green':
        return 'border-l-green-500 bg-green-50/50';
      case 'red':
        return 'border-l-red-500 bg-red-50/50';
      case 'purple':
        return 'border-l-purple-500 bg-purple-50/50';
      case 'orange':
        return 'border-l-orange-500 bg-orange-50/50';
      default:
        return 'border-l-blue-500 bg-blue-50/50';
    }
  };

  const getIconColor = () => {
    switch (colorScheme) {
      case 'green':
        return 'text-green-600';
      case 'red':
        return 'text-red-600';
      case 'purple':
        return 'text-purple-600';
      case 'orange':
        return 'text-orange-600';
      default:
        return 'text-blue-600';
    }
  };

  return (
    <Card className={cn('border-l-4 transition-all hover:shadow-md', getColorScheme())}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn('h-5 w-5', getIconColor())}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className={cn(
          'font-bold mb-1',
          size === 'large' ? 'text-3xl' : 'text-2xl'
        )}>
          {value}
        </div>
        
        {subtitle && (
          <p className="text-xs text-muted-foreground mb-2">
            {subtitle}
          </p>
        )}
        
        {trend && trendValue && (
          <div className="flex items-center gap-1">
            {getTrendIcon()}
            <span className={cn('text-xs font-medium', getTrendColor())}>
              {trendValue}
            </span>
            <span className="text-xs text-muted-foreground">vs mês anterior</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
