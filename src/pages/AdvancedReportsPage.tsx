
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
    <div className="container py-6">
      <PageHeader
        title="Relatórios e Análises Avançadas"
        description="Sistema completo de relatórios personalizáveis e análises avançadas dos seus investimentos imobiliários"
      >
        <Button variant="outline" asChild>
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Dashboard
          </Link>
        </Button>
      </PageHeader>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Dashboard Executivo
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Relatórios Personalizados
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Análises Avançadas
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
