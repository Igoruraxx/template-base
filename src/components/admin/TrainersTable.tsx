import { useState } from 'react';
import { Search, Ban, CheckCircle, CreditCard, Eye } from 'lucide-react';
import { TrainerDetailsModal } from './TrainerDetailsModal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { TrainerOverview } from '@/hooks/useAdminData';

interface TrainersTableProps {
  trainers: TrainerOverview[];
  onBlock: (trainerId: string, blocked: boolean) => void;
  isBlocking: boolean;
  onConfirmPix?: (trainerId: string) => void;
  isConfirmingPix?: boolean;
}

export const TrainersTable = ({ trainers, onBlock, isBlocking, onConfirmPix, isConfirmingPix }: TrainersTableProps) => {
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTrainer, setSelectedTrainer] = useState<TrainerOverview | null>(null);

  const filtered = trainers.filter((t) => {
    const matchSearch =
      (t.full_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (t.email ?? '').toLowerCase().includes(search.toLowerCase());
    const matchPlan = planFilter === 'all' || t.plan === planFilter;
    
    let matchStatus = true;
    if (statusFilter === 'active') matchStatus = t.sub_status === 'active';
    if (statusFilter === 'blocked') matchStatus = t.sub_status === 'blocked';
    if (statusFilter === 'pending') matchStatus = t.sub_status === 'pending_pix';

    return matchSearch && matchPlan && matchStatus;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Filtrar plano" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Planos</SelectItem>
            <SelectItem value="free">Gratuito</SelectItem>
            <SelectItem value="premium">Assinante</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Filtrar status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="blocked">Bloqueado</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Personal</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead className="text-center">Alunos</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Nenhum personal encontrado.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((t) => (
              <TableRow key={t.user_id}>
                <TableCell className="font-medium">{t.full_name || '—'}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{t.email}</TableCell>
                <TableCell>
                  {t.plan === 'premium' ? (
                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30">
                      Assinante
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Gratuito</Badge>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <span className={t.plan === 'free' && t.active_students >= 4 ? 'text-destructive font-bold' : ''}>
                    {t.active_students}
                  </span>
                  {t.plan === 'free' && <span className="text-muted-foreground text-xs">/5</span>}
                </TableCell>
                <TableCell>
                  {t.sub_status === 'blocked' ? (
                    <Badge variant="destructive">Bloqueado</Badge>
                  ) : t.sub_status === 'pending_pix' ? (
                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30">PIX Pendente</Badge>
                  ) : (
                    <Badge className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30">Ativo</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right space-x-1">
                  {t.sub_status === 'pending_pix' && onConfirmPix && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-amber-400 hover:text-amber-300 border-amber-500/30"
                      onClick={() => onConfirmPix(t.user_id)}
                      disabled={isConfirmingPix}
                    >
                      <CreditCard className="h-3.5 w-3.5 mr-1" />
                      Confirmar PIX
                    </Button>
                  )}
                  {t.sub_status === 'blocked' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onBlock(t.user_id, false)}
                      disabled={isBlocking}
                    >
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />
                      Desbloquear
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      onClick={() => onBlock(t.user_id, true)}
                      disabled={isBlocking}
                    >
                      <Ban className="h-3.5 w-3.5 mr-1" />
                      Bloquear
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedTrainer(t)}
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    Detalhes
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <TrainerDetailsModal 
        trainer={selectedTrainer} 
        isOpen={!!selectedTrainer} 
        onClose={() => setSelectedTrainer(null)} 
      />
    </div>
  );
};
