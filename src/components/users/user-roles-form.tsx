import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface UserRolesFormProps {
  userId: string;
  currentRole?: string | null;
}

interface Role {
  id: string;
  name: string;
  description: string | null;
}

export function UserRolesForm({ userId, currentRole }: UserRolesFormProps) {
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Buscar todas as funções disponíveis
  const { data: roles, isLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("roles").select("*");
      
      if (error) throw error;
      return data as Role[];
    },
  });

  useEffect(() => {
    if (currentRole) {
      setSelectedRole(currentRole);
    }
  }, [currentRole]);

  const handleRoleChange = async () => {
    if (!selectedRole || selectedRole === currentRole) return;

    setIsSubmitting(true);

    try {
      // Buscar ID da função selecionada
      const { data: roleData } = await supabase
        .from("roles")
        .select("id")
        .eq("name", selectedRole)
        .single();

      if (!roleData) throw new Error("Função não encontrada");

      // Atualizar função do usuário
      const { error: updateError } = await supabase
        .from("user_roles")
        .update({ role_id: roleData.id })
        .eq("user_id", userId);

      if (updateError) throw updateError;

      toast.success("Função atualizada com sucesso");
    } catch (error) {
      console.error("Erro ao atualizar função:", error);
      toast.error("Erro ao atualizar função");
      // Reverter para a função atual em caso de erro
      setSelectedRole(currentRole || "");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <ShieldCheck className="mr-2 h-5 w-5" /> Gerenciar Função
        </CardTitle>
        <CardDescription>
          Defina a função do usuário no sistema. Isso determinará quais permissões o usuário terá.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="role-select">
              Função
            </label>
            <Select
              value={selectedRole}
              onValueChange={setSelectedRole}
              disabled={isSubmitting}
            >
              <SelectTrigger id="role-select">
                <SelectValue placeholder="Selecione uma função" />
              </SelectTrigger>
              <SelectContent>
                {roles?.map((role) => (
                  <SelectItem key={role.id} value={role.name}>
                    <span className="capitalize">{role.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleRoleChange}
              disabled={
                isSubmitting ||
                !selectedRole ||
                selectedRole === currentRole
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...
                </>
              ) : (
                "Salvar Alterações"
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
