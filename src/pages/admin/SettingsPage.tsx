
import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapboxConfig } from "@/components/admin/mapbox-config";
import { MultiMapboxConfig } from "@/components/admin/multi-mapbox-config";
import { useAuth } from "@/lib/auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("mapbox-multi");
  const { user } = useAuth();
  
  // Verificar se o usuário é admin
  const isAdmin = true; // Implement proper role check

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Acesso restrito</AlertTitle>
          <AlertDescription>
            Você não tem permissões para acessar as configurações do sistema.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader 
        title="Configurações do Sistema" 
        description="Gerencie as configurações globais do sistema."
      />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="mapbox-multi" className="flex items-center gap-2">
            Mapbox Multi-Token
          </TabsTrigger>
          <TabsTrigger value="mapbox-legacy" className="flex items-center gap-2">
            Mapbox (Legacy)
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center gap-2">
            Geral
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            Aparência
          </TabsTrigger>
        </TabsList>
        
        <div className="mt-6">
          <TabsContent value="mapbox-multi" className="mt-0">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Configuração Multi-Token Mapbox</h3>
                <p className="text-sm text-muted-foreground">
                  Configure tokens específicos para diferentes contextos de mapas no sistema.
                </p>
              </div>
              <Separator />
              <MultiMapboxConfig />
            </div>
          </TabsContent>

          <TabsContent value="mapbox-legacy" className="mt-0">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Configuração Mapbox (Legacy)</h3>
                <p className="text-sm text-muted-foreground">
                  Configuração do token único para compatibilidade com versões anteriores.
                </p>
              </div>
              <Separator />
              <MapboxConfig />
            </div>
          </TabsContent>
          
          <TabsContent value="general" className="mt-0">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Configurações Gerais</h3>
                <p className="text-sm text-muted-foreground">
                  Configure as preferências gerais do sistema.
                </p>
              </div>
              <Separator />
              <p className="py-8 text-center text-muted-foreground">
                Configurações gerais serão implementadas em breve.
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="appearance" className="mt-0">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Configurações de Aparência</h3>
                <p className="text-sm text-muted-foreground">
                  Personalize a aparência do sistema.
                </p>
              </div>
              <Separator />
              <p className="py-8 text-center text-muted-foreground">
                Configurações de aparência serão implementadas em breve.
              </p>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
