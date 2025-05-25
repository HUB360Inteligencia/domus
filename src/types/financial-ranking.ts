
export interface PropertyFinancialRanking {
  id: string;
  name: string;
  type: string;
  location: string;
  revenue: number;
  roi: number;
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
