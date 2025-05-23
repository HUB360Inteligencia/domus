
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO, eachMonthOfInterval, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PropertyOccupancyPeriod, OccupancyType } from '@/types/property-occupancy';

interface OccupancyCalendarProps {
  occupancyPeriods: PropertyOccupancyPeriod[];
  isLoading: boolean;
}

type MonthData = {
  month: Date;
  occupancyDays: number;
  totalDays: number;
  occupancyType: OccupancyType | null;
};

export const OccupancyCalendar: React.FC<OccupancyCalendarProps> = ({
  occupancyPeriods,
  isLoading,
}) => {
  const today = new Date();
  
  const monthsData = useMemo(() => {
    const startDate = subMonths(today, 11);
    const endDate = today;
    
    // Create array of months from past 12 months
    const months = eachMonthOfInterval({ start: startDate, end: endDate });
    
    return months.map(monthDate => {
      // Get the last day of the month
      const lastDayOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
      const totalDays = lastDayOfMonth.getDate();
      
      // Initialize data for this month
      const monthData: MonthData = {
        month: monthDate,
        occupancyDays: 0,
        totalDays,
        occupancyType: null
      };
      
      // For each day of the month, check if it's covered by an occupancy period
      for (let day = 1; day <= totalDays; day++) {
        const currentDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
        
        // Find if any occupancy period covers this day
        for (const period of occupancyPeriods) {
          const startDate = new Date(period.start_date);
          const endDate = period.end_date ? new Date(period.end_date) : new Date();
          
          if (currentDate >= startDate && currentDate <= endDate) {
            // This day is covered by an occupancy period
            if (period.occupancy_type !== 'vacant' && period.occupancy_type !== 'maintenance') {
              monthData.occupancyDays++;
              
              // Set the most frequent occupancy type for the month
              // For simplicity, we just use the first one we find, 
              // but this could be improved to pick the most common type
              if (!monthData.occupancyType) {
                monthData.occupancyType = period.occupancy_type;
              }
            }
            break; // Only count once if multiple periods overlap
          }
        }
      }
      
      return monthData;
    });
  }, [occupancyPeriods, today]);

  const getOccupancyTypeColor = (type: OccupancyType | null): string => {
    switch (type) {
      case 'rented': return 'bg-blue-500';
      case 'airbnb': return 'bg-purple-500';
      case 'owner_occupied': return 'bg-green-500';
      default: return 'bg-gray-300';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ocupação por Mês</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ocupação por Mês</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-12 gap-1 mb-2">
          {monthsData.map((data, index) => (
            <div key={index} className="flex flex-col items-center">
              <div className="text-xs font-medium mb-1">
                {format(data.month, 'MMM', { locale: ptBR })}
              </div>
              <div className="w-full h-32 bg-gray-100 rounded relative overflow-hidden">
                <div 
                  className={`absolute bottom-0 w-full ${getOccupancyTypeColor(data.occupancyType)}`}
                  style={{ height: `${(data.occupancyDays / data.totalDays) * 100}%` }}
                ></div>
              </div>
              <div className="text-xs mt-1">
                {Math.round((data.occupancyDays / data.totalDays) * 100)}%
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-xs">Alugado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span className="text-xs">Airbnb</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-xs">Proprietário</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-300"></div>
            <span className="text-xs">Vago</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
