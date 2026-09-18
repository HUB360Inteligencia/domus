import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Monitor, Moon, Sun, XCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

const ENVIRONMENT_CHECKS = [
  { label: "Supabase (banco e autenticação)", configured: Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) },
  { label: "Mapbox (mapas e geolocalização)", configured: Boolean(import.meta.env.VITE_MAPBOX_TOKEN) },
];

const THEME_OPTIONS = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Escuro", icon: Moon },
  { value: "system", label: "Seguir o sistema", icon: Monitor },
] as const;

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  
  // Verificar se o usuário é system_admin (Dono do SaaS)
  const isSystemAdmin = user?.role === 'system_admin';

  if (!isSystemAdmin) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Acesso restrito</AlertTitle>
          <AlertDescription>
            Você não tem permissões de Administrador do Sistema para acessar estas configurações globais.
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
          <TabsTrigger value="general" className="flex items-center gap-2">
            Geral
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            Aparência
          </TabsTrigger>
        </TabsList>
        
        <div className="mt-6">
          <TabsContent value="general" className="mt-0">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Configurações Gerais</h3>
                <p className="text-sm text-muted-foreground">
                  Configure as preferências gerais do sistema.
                </p>
              </div>
              <Separator />
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Chaves de infraestrutura ficam nas variáveis de ambiente (.env / painel de deploy), não no banco, por segurança.
                </p>
                <ul className="divide-y divide-border rounded-3xl border">
                  {ENVIRONMENT_CHECKS.map((check) => (
                    <li key={check.label} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                      <span>{check.label}</span>
                      {check.configured ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                          <CheckCircle2 className="h-4 w-4" /> Configurado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-rose-700 dark:text-rose-300">
                          <XCircle className="h-4 w-4" /> Ausente
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground">
                  Ambiente: {import.meta.env.MODE === "production" ? "Produção" : "Desenvolvimento"}
                </p>
              </div>
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
              <div className="grid gap-3 sm:grid-cols-3">
                {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTheme(value)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-3xl border p-5 text-sm font-medium transition-colors",
                      theme === value ? "border-accent bg-accent/10" : "hover:bg-muted/60"
                    )}
                    aria-pressed={theme === value}
                  >
                    <Icon className="h-6 w-6" />
                    {label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">A preferência fica salva neste navegador.</p>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
