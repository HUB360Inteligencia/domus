
import { Building, CheckCircle, Clock, HomeIcon, TrendingUp, User, AlertCircle, FileText, CalendarClock } from "lucide-react";
import { StatsCard } from "@/components/stats-card";
import { PropertyCard } from "@/components/property-card";
import { ContractList } from "@/components/contract-list";
import { OverviewChart } from "@/components/overview-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProperties } from "@/hooks/use-properties";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { useContractStats, useFinancialStats, useFinancialChartData, useUpcomingEvents, useRecentContracts } from "@/hooks/use-contract-analytics";

export default function Dashboard() {
  const navigate = useNavigate();
  const { properties, isLoading: isLoadingProperties } = useProperties();
  const { data: contractStats, isLoading: isLoadingContractStats } = useContractStats();
  const { data: financialStats, isLoading: isLoadingFinancialStats } = useFinancialStats();
  const { data: chartData, isLoading: isLoadingChartData } = useFinancialChartData();
  const { data: upcomingEvents, isLoading: isLoadingEvents } = useUpcomingEvents();
  const { data: contracts, isLoading: isLoadingContracts } = useRecentContracts();
  
  const [propertyStats, setPropertyStats] = useState({
    total: 0,
    available: 0,
    rented: 0,
    airbnb: 0
  });

  useEffect(() => {
    // Calculate property statistics
    if (properties.length > 0) {
      const total = properties.length;
      const available = properties.filter(p => p.status === 'available').length;
      const rented = properties.filter(p => p.status === 'rented').length;
      const airbnb = properties.filter(p => p.status === 'airbnb').length;
      
      setPropertyStats({
        total,
        available,
        rented,
        airbnb
      });
    }
  }, [properties]);

  const handlePropertySelect = (id: string) => {
    navigate(`/properties/detail?id=${id}`);
  };

  const handleContractView = (id: string) => {
    navigate(`/contracts/detail?id=${id}`);
  };

  const handleContractEdit = (id: string) => {
    navigate(`/contracts/edit?id=${id}`);
  };

  const handleContractDownload = (id: string) => {
    console.log("Download contract:", id);
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("pt-BR").format(date);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-500";
      case "medium":
        return "text-amber-500";
      case "low":
        return "text-blue-500";
      default:
        return "text-muted-foreground";
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "contract":
        return <FileText className="h-4 w-4" />;
      case "payment":
        return <AlertCircle className="h-4 w-4" />;
      case "maintenance":
        return <Clock className="h-4 w-4" />;
      default:
        return <CalendarClock className="h-4 w-4" />;
    }
  };

  // Select the 3 most recent properties to display in the dashboard
  const recentProperties = [...properties]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);
    
  const isLoading = isLoadingProperties || isLoadingContractStats || isLoadingFinancialStats;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            {Array(4).fill(0).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-8 w-2/3 mb-2" />
                  <Skeleton className="h-12 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <StatsCard
              title="Total de Imóveis"
              value={propertyStats.total.toString()}
              description={`${propertyStats.available} disponíveis, ${propertyStats.rented} alugados, ${propertyStats.airbnb} em Airbnb`}
              icon={Building}
              iconColor="text-petroleum"
            />
            <StatsCard
              title="Contratos Ativos"
              value={(contractStats?.active || 0).toString()}
              description={`${contractStats?.expiringSoon || 0} contratos a vencer em breve`}
              icon={FileText}
              iconColor="text-petroleum"
            />
            <StatsCard
              title="Faturamento Mensal"
              value={financialStats?.monthlyIncome || "R$ 0,00"}
              description={`Anual: ${financialStats?.annualIncome || "R$ 0,00"}`}
              icon={TrendingUp}
              iconColor="text-petroleum"
              trend="up"
              trendValue="+5%"
            />
            <StatsCard
              title="Taxa de Ocupação"
              value={financialStats?.occupancyRate || "0%"}
              description="Imóveis ocupados vs. total"
              icon={CheckCircle}
              iconColor="text-petroleum"
              trend="up"
              trendValue="+3%"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {isLoadingChartData ? (
            <Card>
              <CardHeader>
                <CardTitle>Receitas e Despesas (2024)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center">
                  <Skeleton className="h-full w-full" />
                </div>
              </CardContent>
            </Card>
          ) : (
            <OverviewChart data={chartData || []} title="Receitas e Despesas (2024)" />
          )}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Próximos Eventos</CardTitle>
            <CardDescription>
              Prazos e eventos importantes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingEvents ? (
              <div className="space-y-4">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="flex items-start gap-3 pb-3 border-b last:border-b-0 last:pb-0">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <div className="w-full">
                      <Skeleton className="h-5 w-3/4 mb-1" />
                      <Skeleton className="h-4 w-1/2 mb-1" />
                      <Skeleton className="h-4 w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : upcomingEvents && upcomingEvents.length > 0 ? (
              <div className="space-y-4">
                {upcomingEvents.map(event => (
                  <div 
                    key={event.id} 
                    className="flex items-start gap-3 pb-3 border-b last:border-b-0 last:pb-0"
                  >
                    <div className={`p-1.5 rounded-md bg-muted ${getPriorityColor(event.priority)}`}>
                      {getEventIcon(event.type)}
                    </div>
                    <div>
                      <p className="font-medium">{event.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {event.property}
                      </p>
                      <p className="text-xs mt-0.5">{formatDate(event.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                Nenhum evento próximo encontrado
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="properties">
        <TabsList className="mb-4">
          <TabsTrigger value="properties">Imóveis</TabsTrigger>
          <TabsTrigger value="contracts">Contratos</TabsTrigger>
        </TabsList>
        <TabsContent value="properties" className="space-y-4">
          {isLoadingProperties ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array(3).fill(0).map((_, i) => (
                <Card key={i}>
                  <div className="h-48 bg-muted" />
                  <CardContent className="p-4">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentProperties.length > 0 ? (
                recentProperties.map(property => (
                  <PropertyCard 
                    key={property.id}
                    id={property.id}
                    title={property.title}
                    address={property.address}
                    city={property.city}
                    state={property.state}
                    type={property.type}
                    status={property.status}
                    value={property.value}
                    imageUrl={property.image_url}
                    onSelect={handlePropertySelect}
                  />
                ))
              ) : (
                <div className="col-span-3 py-8 text-center text-muted-foreground">
                  Nenhum imóvel cadastrado
                </div>
              )}
            </div>
          )}
        </TabsContent>
        <TabsContent value="contracts">
          {isLoadingContracts ? (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-4">
                  {Array(3).fill(0).map((_, i) => (
                    <div key={i} className="flex flex-col space-y-3">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            contracts && contracts.length > 0 ? (
              <ContractList 
                contracts={contracts} 
                onView={handleContractView}
                onEdit={handleContractEdit}
                onDownload={handleContractDownload}
              />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">Nenhum contrato cadastrado</p>
                </CardContent>
              </Card>
            )
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
