
export interface PropertyFinancialRanking {
  propertyId: string;
  propertyTitle: string;
  revenue: number;
  expenses: number;
  netIncome: number;
  roi: number;
  // Additional properties for the dashboard
  id?: string;
  name?: string;
  type?: string;
  location?: string;
  neighborhood?: string;
  monthlyReturn?: number;
  returnPercentage?: number;
}

export interface PropertyRankingItem {
  id: string;
  name: string;
  type: string;
  location: string;
  return: number;
  percentage: number;
}

export interface NeighborhoodRankingItem {
  name: string;
  revenue: number;
  count: number;
  roi: number;
}
