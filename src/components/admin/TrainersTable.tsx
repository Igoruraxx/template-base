import { useState } from 'react';
import { Search, Ban, CheckCircle } from 'lucide-react';
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
}

export const TrainersTable = ({ trainers, onBlock, isBlocking }: TrainersTableProps) => {
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('all');

  const filtered = trainers.filter((t) => {
    const matchSearch =
      (t.full_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (t.email ?? '').toLowerCase().includes(search.toLowerCase());
    const matchPlan = planFilter === 'all' || t.plan === planFilter;
    return matchSearch && matchPlan;
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
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filtrar plano" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="free">Gratuito</SelectItem>
            <SelectItem value="premium">Assinante</SelectItem>
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
                  ) : (
                    <Badge className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30">Ativo</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
