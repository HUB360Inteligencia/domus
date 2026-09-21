import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Link2Off, MapPinned, Ruler, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useDevelopmentLots } from '@/hooks/use-development-lots';
import { LotBatchDialog } from './lot-batch-dialog';
import { formatCurrency } from '@/lib/format';
import type { Development } from '@/types/development';
import type { PropertyStatus } from '@/types/property';
import { LOT_STATUSES, type DevelopmentLot } from '@/types/development-lot';

interface DevelopmentLotsSectionProps {
  development: Development;
}

const statusTone: Record<string, string> = {
  available: 'bg-[#4a7c59] hover:bg-[#4a7c59] text-white',
  reserved: 'bg-[#8a6fa8] hover:bg-[#8a6fa8] text-white',
  sold: 'bg-stone-500 hover:bg-stone-500 text-white',
};

const StatTile: React.FC<{ label: string; value: string; hint?: string }> = ({ label, value, hint }) => (
  <div className="rounded-xl border border-border bg-card p-3">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="mt-1 text-lg font-bold">{value}</p>
    {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
  </div>
);

export const DevelopmentLotsSection: React.FC<DevelopmentLotsSectionProps> = ({ development }) => {
  const {
    groups,
    lots,
    totals,
    isLoading,
    generateLots,
    isGenerating,
    changeLotStatus,
    unlinkLot,
  } = useDevelopmentLots(development.id);

  const [showGenerator, setShowGenerator] = useState(false);

  const renderLotRow = (lot: DevelopmentLot) => (
    <TableRow key={lot.id}>
      <TableCell className="font-medium">{lot.property_number || '—'}</TableCell>
      <TableCell>{lot.land_area ? `${lot.land_area.toLocaleString('pt-BR')} m²` : '—'}</TableCell>
      <TableCell className="text-right">{formatCurrency(lot.value)}</TableCell>
      <TableCell>
        <Select
          value={lot.status}
          onValueChange={(value) =>
            changeLotStatus({ propertyId: lot.id, status: value as PropertyStatus })
          }
        >
          <SelectTrigger className="h-8 w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LOT_STATUSES.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/properties/${lot.id}`}>
              <ExternalLink className="h-4 w-4" />
              Abrir
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" title="Desvincular do loteamento">
                <Link2Off className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Desvincular {lot.title}?</AlertDialogTitle>
                <AlertDialogDescription>
                  O imóvel continua cadastrado, só deixa de pertencer a este loteamento.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => unlinkLot(lot.id)}>Desvincular</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </TableRow>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold">Lotes</h3>
          <p className="text-sm text-muted-foreground">
            Cada lote é um imóvel completo: tem foto, documento, contrato e financeiro próprios.
          </p>
        </div>
        <Button onClick={() => setShowGenerator(true)}>
          <Wand2 className="h-4 w-4" />
          Gerar lotes
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : lots.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-3xl bg-muted">
              <MapPinned className="h-7 w-7 text-muted-foreground" />
            </div>
            <h4 className="mb-2 text-lg font-semibold">Nenhum lote cadastrado</h4>
            <p className="mx-auto mb-4 max-w-md text-muted-foreground">
              Use o assistente para criar a numeração de uma quadra inteira de uma vez, já com área
              e preço padrão.
            </p>
            <Button onClick={() => setShowGenerator(true)}>
              <Wand2 className="h-4 w-4" />
              Gerar lotes
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {totals && (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatTile
                  label="Lotes"
                  value={String(totals.totalLots)}
                  hint={`${totals.availableLots} disponíveis · ${totals.reservedLots} reservados`}
                />
                <StatTile label="VGV total" value={formatCurrency(totals.totalMarketValue)} />
                <StatTile
                  label="Vendido"
                  value={formatCurrency(totals.soldValue)}
                  hint={`${totals.soldLots} de ${totals.totalLots} lotes`}
                />
                <StatTile
                  label="Área total"
                  value={`${totals.totalLandArea.toLocaleString('pt-BR')} m²`}
                />
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">VGV vendido</span>
                  <span className="font-semibold">{totals.soldPercentage.toFixed(1)}%</span>
                </div>
                <Progress value={Math.min(totals.soldPercentage, 100)} />
              </div>
            </div>
          )}

          {groups.map((group) => (
            <Card key={group.block ?? 'sem-quadra'}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Ruler className="h-4 w-4" />
                  {group.block ? `Quadra ${group.block}` : 'Sem quadra'}
                  <Badge variant="secondary">{group.lots.length}</Badge>
                  {group.lots.every((lot) => lot.status === 'sold') && (
                    <Badge className={statusTone.sold}>Quadra vendida</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lote</TableHead>
                        <TableHead>Área</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead>Situação</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>{group.lots.map(renderLotRow)}</TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ))}
        </>
      )}

      <LotBatchDialog
        development={development}
        open={showGenerator}
        onOpenChange={setShowGenerator}
        onConfirm={(input) => generateLots({ development, input })}
        isSubmitting={isGenerating}
      />
    </div>
  );
};
