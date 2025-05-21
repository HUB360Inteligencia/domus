
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ProfilePage() {
  const { user } = useAuth();
  
  const getInitials = () => {
    if (!user || !user.profile) return "?";
    
    const firstName = user.profile.first_name || "";
    const lastName = user.profile.last_name || "";
    
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Perfil"
        description="Gerencie seu perfil de usuário"
      />
      
      <Card>
        <CardHeader>
          <CardTitle>Informações Pessoais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user?.profile?.avatar_url || ""} alt="Avatar" />
              <AvatarFallback className="bg-petroleum text-lg">{getInitials()}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-medium">
                {user?.profile?.first_name} {user?.profile?.last_name}
              </h3>
              <p className="text-muted-foreground">{user?.email}</p>
              {user?.role && (
                <div className="mt-1">
                  <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold">
                    {user.role === 'admin' ? 'Administrador' :
                     user.role === 'manager' ? 'Gestor' :
                     user.role === 'user' ? 'Usuário' : 'Visualizador'}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-6 flex gap-2">
            <Button>Editar Perfil</Button>
            <Button variant="outline">Alterar Senha</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
