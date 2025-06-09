
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useDashboardMetrics } from '@/hooks/use-dashboard-metrics';
import { formatCurrency } from '@/utils/currency';

export function MiniTrendsWidget() {
  const metrics = useDashboardMetrics();

  const trends = [
    {
      label: 'Receitas',
      value: formatCurrency(metrics.totalRevenue),
      trend: metrics.revenueTrend,
      change: '+12.5%'
    },
    {
      label: 'Despesas',
      value: formatCurrency(metrics.totalExpenses),
      trend: metrics.expensesTrend === 'up' ? 'down' : metrics.expensesTrend === 'down' ? 'up' : 'neutral',
      change: '-3.2%'
    },
    {
      label: 'Lucro',
      value: formatCurrency(metrics.netBalance),
      trend: metrics.profitTrend,
      change: '+8.7%'
    }
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-600" />;
      default:
        return <Minus className="h-3 w-3 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
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
    <Card className="shadow-sm hover:shadow-md transition-shadow bg-gray-25 border-gray-100 h-48">
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Tendências</h3>
        
        <div className="space-y-3">
          {trends.map((item, index) => (
            <div key={index} className="flex items-center justify-between py-1">
              <div className="flex-1">
                <div className="text-xs text-gray-600 mb-0.5">{item.label}</div>
                <div className="text-sm font-semibold text-gray-900">{item.value}</div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className={`text-xs font-medium ${getTrendColor(item.trend)}`}>
                  {item.change}
                </span>
                {getTrendIcon(item.trend)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
