
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusIcon, UploadIcon, ArrowDownIcon } from "lucide-react";
import { TransactionFormMobile } from '@/components/finances/transaction-form-mobile';
import { useIsMobile } from '@/hooks/use-mobile';

export default function FinancesPage() {
  const [showForm, setShowForm] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold">Finanças</h1>

      <Tabs defaultValue="transactions" className="mt-6">
        <TabsList>
          <TabsTrigger value="transactions">Transações</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>
        
        <TabsContent value="transactions" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {isMobile && showForm ? (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Nova Transação</h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowForm(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                  <TransactionFormMobile 
                    onSuccess={() => setShowForm(false)} 
                  />
                </div>
              ) : (
                <div>
                  <p>Conteúdo das transações</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="reports" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <p>Relatórios financeiros</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {isMobile && !showForm && (
        <div className="fixed bottom-6 right-6 z-10">
          <Button 
            size="lg" 
            className="rounded-full h-14 w-14 shadow-lg"
            onClick={() => setShowForm(true)}
          >
            <PlusIcon className="h-6 w-6" />
          </Button>
        </div>
      )}
    </div>
  );
}
