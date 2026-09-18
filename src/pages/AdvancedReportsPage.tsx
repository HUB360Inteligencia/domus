
import React from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CustomReportBuilder } from '@/components/reports/CustomReportBuilder';
import { AdvancedAnalytics } from '@/components/analytics/AdvancedAnalytics';
import { ExecutiveDashboard } from '@/components/dashboard/ExecutiveDashboard';
import { BarChart3, TrendingUp, Target, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';

export default function AdvancedReportsPage() {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'dashboard';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios e análises"
        description="Indicadores executivos, relatórios personalizados e análises da carteira."
      >
        <Button variant="outline" asChild>
          <Link to="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
        </Button>
      </PageHeader>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="grid h-auto w-full grid-cols-3 gap-1">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <Target className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Dashboard executivo</span>
            <span className="sm:hidden">Executivo</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Relatórios personalizados</span>
            <span className="sm:hidden">Relatórios</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Análises avançadas</span>
            <span className="sm:hidden">Análises</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <ExecutiveDashboard />
        </TabsContent>

        <TabsContent value="reports">
          <CustomReportBuilder />
        </TabsContent>

        <TabsContent value="analytics">
          <AdvancedAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}
