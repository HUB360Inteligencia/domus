
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Home, DollarSign, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';

interface PropertyAnalyticsSummaryProps {
  summary: {
    totalProperties: number;
    averageROI: number;
    totalMarketValue: number;
    averageVacancy: number;
    totalMonthlyRevenue: number;
  };
  isLoading: boolean;
}

export function PropertyAnalyticsSummary({ summary, isLoading }: PropertyAnalyticsSummaryProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="bg-gray-200 h-4 rounded mb-2" />
              <div className="bg-gray-200 h-8 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total de Propriedades',
      value: summary.totalProperties.toString(),
      icon: Home,
      color: 'text-blue-600'
    },
    {
      title: 'ROI Médio Mensal',
      value: `${summary.averageROI.toFixed(2)}%`,
      icon: TrendingUp,
      color: summary.averageROI > 0 ? 'text-green-600' : 'text-red-600'
    },
    {
      title: 'Valor Total do Portfólio',
      value: formatCurrency(summary.totalMarketValue),
      icon: DollarSign,
      color: 'text-purple-600'
    },
    {
      title: 'Taxa de Vacância Média',
      value: `${summary.averageVacancy.toFixed(1)}%`,
      icon: AlertTriangle,
      color: summary.averageVacancy > 25 ? 'text-red-600' : summary.averageVacancy > 10 ? 'text-yellow-600' : 'text-green-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  {card.title}
                </p>
                <p className={`text-2xl font-bold ${card.color}`}>
                  {card.value}
                </p>
              </div>
              <card.icon className={`h-8 w-8 ${card.color}`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
