
import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CustomReportBuilder } from '@/components/reports/CustomReportBuilder';
import { AdvancedAnalytics } from '@/components/analytics/AdvancedAnalytics';
import { ExecutiveDashboard } from '@/components/dashboard/ExecutiveDashboard';
import { BarChart3, TrendingUp, Target } from 'lucide-react';

export default function AdvancedReportsPage() {
  return (
    <div className="container py-6">
      <PageHeader
        title="Relatórios e Analytics Avançados"
        description="Sistema completo de relatórios personalizáveis e análises avançadas"
      />

      <Tabs defaultValue="dashboard" className="space-y-6">
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
            Analytics Avançados
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
