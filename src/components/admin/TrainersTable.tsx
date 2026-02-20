import { useState } from 'react';
import { Search, Ban, CheckCircle, CreditCard, Eye, Trash2, UserPlus } from 'lucide-react';
import { isAfter, subHours } from 'date-fns';
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
  onDelete?: (trainerId: string) => void;
  isDeleting?: boolean;
}

export const TrainersTable = ({ trainers, onBlock, isBlocking, onConfirmPix, isConfirmingPix, onDelete, isDeleting }: TrainersTableProps) => {
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [advancedFilter, setAdvancedFilter] = useState<string>('all');
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

    let matchAdvanced = true;
    if (advancedFilter === 'debt') matchAdvanced = t.sub_status === 'pending_pix';
    if (advancedFilter === 'risk') matchAdvanced = t.plan === 'free' && t.active_students === 0;
    if (advancedFilter === 'new') {
      const oneDayAgo = subHours(new Date(), 24);
      matchAdvanced = t.created_at ? isAfter(new Date(t.created_at), oneDayAgo) : false;
    }

    return matchSearch && matchPlan && matchStatus && matchAdvanced;
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
        
        <Select value={advancedFilter} onValueChange={setAdvancedFilter}>
          <SelectTrigger className="w-full sm:w-[160px] border-primary/20 bg-primary/5">
            <SelectValue placeholder="Inteligência" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Métricas</SelectItem>
            <SelectItem value="new" className="text-blue-500 font-medium">🆕 Novos Cadastros (24h)</SelectItem>
            <SelectItem value="debt" className="text-amber-500 font-medium">💰 Inadimplentes</SelectItem>
            <SelectItem value="risk" className="text-destructive font-medium">⚠️ Em Risco (0 Alunos)</SelectItem>
          </SelectContent>
        </Select>

        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-full sm:w-[130px]">
            <SelectValue placeholder="Plano" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Planos</SelectItem>
            <SelectItem value="free">Gratuito</SelectItem>
            <SelectItem value="premium">Assinante</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[130px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="blocked">Bloqueado</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border overflow-hidden shadow-sm">
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
            {filtered.map((t) => {
              const isNew = t.created_at ? isAfter(new Date(t.created_at), subHours(new Date(), 24)) : false;
              return (
                <TableRow key={t.user_id} className={isNew ? 'bg-blue-500/5 transition-colors' : 'transition-colors'}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {t.full_name || '—'}
                      {isNew && (
                        <Badge className="bg-blue-500 text-white hover:bg-blue-600 animate-pulse text-[10px] h-4 px-1 leading-none border-none">
                          NOVO
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{t.email}</TableCell>
                  <TableCell>
                    {t.role === 'admin' ? (
                      <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 hover:bg-purple-500/30">
                        Administrador
                      </Badge>
                    ) : t.plan === 'premium' ? (
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
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedTrainer(t)}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      Ficha Completa
                    </Button>
                    {onDelete && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => onDelete(t.user_id)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <TrainerDetailsModal 
        trainer={selectedTrainer} 
        isOpen={!!selectedTrainer} 
        onClose={() => setSelectedTrainer(null)} 
        onBlock={onBlock}
        isBlocking={isBlocking}
        onConfirmPix={onConfirmPix}
        isConfirmingPix={isConfirmingPix}
        onDelete={onDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};
