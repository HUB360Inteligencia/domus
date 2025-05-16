
import { Building, CheckCircle, Clock, HomeIcon, TrendingUp, User, AlertCircle, FileText, CalendarClock } from "lucide-react";
import { StatsCard } from "@/components/stats-card";
import { PropertyCard } from "@/components/property-card";
import { ContractList } from "@/components/contract-list";
import { OverviewChart } from "@/components/overview-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Sample data
const propertyStats = {
  total: 12,
  available: 3,
  rented: 8,
  airbnb: 1
};

const contractStats = {
  total: 10,
  active: 8,
  expiringSoon: 2
};

const financialStats = {
  monthlyIncome: "R$ 38.500,00",
  annualIncome: "R$ 462.000,00",
  occupancyRate: "91%"
};

const properties = [
  {
    id: "prop1",
    title: "Apartamento Centro",
    address: "Rua das Flores, 123",
    city: "São Paulo",
    state: "SP",
    type: "Apartamento",
    status: "rented" as const,
    value: 6500
  },
  {
    id: "prop2",
    title: "Casa de Praia",
    address: "Av. Beira Mar, 1000",
    city: "Florianópolis",
    state: "SC",
    type: "Casa",
    status: "airbnb" as const,
    value: 12000
  },
  {
    id: "prop3",
    title: "Sala Comercial",
    address: "Av. Paulista, 1000",
    city: "São Paulo",
    state: "SP",
    type: "Comercial",
    status: "available" as const,
    value: 4500
  }
];

const contracts = [
  {
    id: "con1",
    title: "Contrato de Aluguel #2023-01",
    property: "Apartamento Centro",
    tenant: "Ana Paula Silva",
    startDate: "2023-01-15",
    endDate: "2024-01-14",
    value: 6500,
    status: "active" as const
  },
  {
    id: "con2",
    title: "Contrato de Aluguel #2023-02",
    property: "Sala Comercial Paulista",
    tenant: "Empresa ABC Ltda",
    startDate: "2023-03-01",
    endDate: "2023-03-01",
    value: 9800,
    status: "active" as const
  },
  {
    id: "con3",
    title: "Contrato de Aluguel #2022-08",
    property: "Casa na Praia",
    tenant: "Roberto Mendes",
    startDate: "2022-12-15",
    endDate: "2023-06-15",
    value: 12000,
    status: "expired" as const
  }
];

const chartData = [
  { name: 'Jan', income: 45000, expenses: 12000 },
  { name: 'Fev', income: 45000, expenses: 14000 },
  { name: 'Mar', income: 48000, expenses: 12000 },
  { name: 'Abr', income: 48000, expenses: 15000 },
  { name: 'Mai', income: 52000, expenses: 18000 },
  { name: 'Jun', income: 52000, expenses: 13000 },
];

const upcomingEvents = [
  {
    id: "ev1",
    title: "Vencimento de Contrato",
    property: "Apartamento Centro",
    date: "2024-06-15",
    type: "contract",
    priority: "high"
  },
  {
    id: "ev2",
    title: "Vencimento IPTU",
    property: "Casa de Praia",
    date: "2024-06-20",
    type: "payment",
    priority: "medium"
  },
  {
    id: "ev3",
    title: "Manutenção Ar Condicionado",
    property: "Sala Comercial",
    date: "2024-06-25",
    type: "maintenance",
    priority: "low"
  }
];

export default function Dashboard() {
  const handlePropertySelect = (id: string) => {
    console.log("Property selected:", id);
  };

  const handleContractView = (id: string) => {
    console.log("View contract:", id);
  };

  const handleContractEdit = (id: string) => {
    console.log("Edit contract:", id);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total de Imóveis"
          value={propertyStats.total.toString()}
          description={`${propertyStats.available} disponíveis, ${propertyStats.rented} alugados, ${propertyStats.airbnb} em Airbnb`}
          icon={Building}
          iconColor="text-petroleum"
        />
        <StatsCard
          title="Contratos Ativos"
          value={contractStats.active.toString()}
          description={`${contractStats.expiringSoon} contratos a vencer em breve`}
          icon={FileText}
          iconColor="text-petroleum"
        />
        <StatsCard
          title="Faturamento Mensal"
          value={financialStats.monthlyIncome}
          description={`Anual: ${financialStats.annualIncome}`}
          icon={TrendingUp}
          iconColor="text-petroleum"
          trend="up"
          trendValue="+5%"
        />
        <StatsCard
          title="Taxa de Ocupação"
          value={financialStats.occupancyRate}
          description="Imóveis ocupados vs. total"
          icon={CheckCircle}
          iconColor="text-petroleum"
          trend="up"
          trendValue="+3%"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <OverviewChart data={chartData} title="Receitas e Despesas (2024)" />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Próximos Eventos</CardTitle>
            <CardDescription>
              Prazos e eventos importantes
            </CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="properties">
        <TabsList className="mb-4">
          <TabsTrigger value="properties">Imóveis</TabsTrigger>
          <TabsTrigger value="contracts">Contratos</TabsTrigger>
        </TabsList>
        <TabsContent value="properties" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {properties.map(property => (
              <PropertyCard 
                key={property.id}
                {...property}
                onSelect={handlePropertySelect}
              />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="contracts">
          <ContractList 
            contracts={contracts} 
            onView={handleContractView}
            onEdit={handleContractEdit}
            onDownload={handleContractDownload}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
