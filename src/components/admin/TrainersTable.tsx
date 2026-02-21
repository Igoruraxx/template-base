import { useState } from 'react';
import { Search, Ban, CheckCircle, CreditCard, Eye, Trash2, UserPlus, Filter, MoreVertical, GraduationCap, CalendarPlus, ArrowDownCircle } from 'lucide-react';
import { isAfter, subHours, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrainerDetailsModal } from './TrainerDetailsModal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { TrainerOverview } from '@/hooks/useAdminData';
import { cn } from '@/lib/utils';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

interface TrainersTableProps {
  trainers: TrainerOverview[];
  onBlock: (trainerId: string, blocked: boolean) => void;
  isBlocking: boolean;
  onConfirmPix?: (trainerId: string) => void;
  isConfirmingPix?: boolean;
  onDelete?: (trainerId: string) => void;
  isDeleting?: boolean;
  onAddDays?: (trainerId: string, days: number) => void;
  isAddingDays?: boolean;
  onDowngrade?: (trainerId: string) => void;
  isDowngrading?: boolean;
}

export const TrainersTable = ({ trainers, onBlock, isBlocking, onConfirmPix, isConfirmingPix, onDelete, isDeleting, onAddDays, isAddingDays, onDowngrade, isDowngrading }: TrainersTableProps) => {
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [advancedFilter, setAdvancedFilter] = useState<string>('all');
  const [selectedTrainer, setSelectedTrainer] = useState<TrainerOverview | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [customDays, setCustomDays] = useState('');

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
      {/* Header with Search and Mobile Filter Toggle */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar personal..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 sm:h-10 bg-card border-border/50 focus:border-primary/50"
            />
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            className={cn(
              "md:hidden h-11 w-11 shrink-0 transition-colors",
              isFilterOpen ? "bg-primary/10 border-primary/50 text-primary" : "bg-card"
            )}
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <Filter className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Responsive Filters */}
        <div className={cn(
          "grid grid-cols-1 sm:grid-cols-3 gap-2 md:flex md:flex-row md:items-center transition-all duration-300 overflow-hidden",
          isFilterOpen ? "max-h-[300px] opacity-100" : "max-h-0 opacity-0 md:max-h-none md:opacity-100"
        )}>
          <Select value={advancedFilter} onValueChange={setAdvancedFilter}>
            <SelectTrigger className="w-full md:w-[160px] bg-card border-border/50 h-11 md:h-9">
              <SelectValue placeholder="Inteligência" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Métricas</SelectItem>
              <SelectItem value="new">🆕 Novos (24h)</SelectItem>
              <SelectItem value="debt">💰 Inadimplentes</SelectItem>
              <SelectItem value="risk">⚠️ Em Risco</SelectItem>
            </SelectContent>
          </Select>

          <Select value={planFilter} onValueChange={setPlanFilter}>
            <SelectTrigger className="w-full md:w-[130px] bg-card border-border/50 h-11 md:h-9">
              <SelectValue placeholder="Plano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Planos</SelectItem>
              <SelectItem value="free">Gratuito</SelectItem>
              <SelectItem value="premium">Assinante</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[130px] bg-card border-border/50 h-11 md:h-9">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="blocked">Bloqueado</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            variant="ghost" 
            size="sm" 
            className="hidden md:flex text-muted-foreground hover:text-foreground h-9"
            onClick={() => {
              setAdvancedFilter('all');
              setPlanFilter('all');
              setStatusFilter('all');
              setSearch('');
            }}
          >
            Limpar
          </Button>
        </div>
      </div>

      {/* Desktop View: Table */}
      <div className="hidden md:block rounded-xl border border-border/50 overflow-hidden bg-card/30 backdrop-blur-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-bold">Personal</TableHead>
              <TableHead className="font-bold">E-mail</TableHead>
              <TableHead className="font-bold">Plano</TableHead>
              <TableHead className="text-center font-bold">Alunos</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              <TableHead className="font-bold">Expira</TableHead>
              <TableHead className="text-right font-bold">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                  Nenhum personal encontrado.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((t) => {
              const isNew = t.created_at ? isAfter(new Date(t.created_at), subHours(new Date(), 24)) : false;
              const isAdmin = t.role === 'admin';
              return (
                <TableRow key={t.user_id} className={cn(
                  "group transition-colors h-16 hover:bg-muted/30",
                  isNew && "bg-blue-500/5 hover:bg-blue-500/10"
                )}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{t.full_name || '—'}</span>
                      {isNew && (
                        <Badge className="bg-blue-500 text-white animate-pulse text-[9px] h-4 px-1.5 border-none">
                          NOVO
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm font-medium">{t.email}</TableCell>
                  <TableCell>
                    {isAdmin ? (
                      <Badge className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-none shadow-sm shadow-purple-500/20">
                        ADMIN MASTER
                      </Badge>
                    ) : t.plan === 'premium' ? (
                      <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20 shadow-none">
                        Assinante
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-muted text-muted-foreground border-transparent shadow-none">Gratuito</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center justify-center">
                      <span className={cn(
                        "font-bold",
                        t.plan === 'free' && t.active_students >= 4 ? 'text-destructive' : 'text-foreground'
                      )}>
                        {t.active_students}
                      </span>
                      {t.plan === 'free' && <span className="text-[10px] text-muted-foreground font-medium uppercase">Limite 5</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    {t.sub_status === 'blocked' ? (
                      <Badge variant="destructive" className="shadow-none">Bloqueado</Badge>
                    ) : t.sub_status === 'pending_pix' ? (
                      <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-none">PIX Pendente</Badge>
                    ) : (
                      <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-none">Ativo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {t.expires_at ? format(new Date(t.expires_at), 'dd/MM/yyyy', { locale: ptBR }) : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="hover:bg-primary/10 hover:text-primary transition-all active:scale-95"
                        onClick={() => setSelectedTrainer(t)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                      {!isAdmin && onAddDays && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button size="sm" variant="ghost" className="hover:bg-emerald-500/10 hover:text-emerald-500" disabled={isAddingDays}>
                              <CalendarPlus className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-48 p-2" align="end">
                            <p className="text-xs font-bold mb-2 text-muted-foreground">Adicionar dias premium</p>
                            <div className="grid grid-cols-2 gap-1">
                              {[7, 15, 30, 90].map(d => (
                                <Button key={d} size="sm" variant="outline" className="text-xs h-8" onClick={() => onAddDays(t.user_id, d)}>
                                  +{d} dias
                                </Button>
                              ))}
                            </div>
                            <div className="flex gap-1 mt-2">
                              <Input
                                type="number"
                                placeholder="Custom"
                                value={customDays}
                                onChange={(e) => setCustomDays(e.target.value)}
                                className="h-8 text-xs"
                              />
                              <Button size="sm" variant="default" className="h-8 text-xs px-2" 
                                onClick={() => { if (customDays) { onAddDays(t.user_id, parseInt(customDays)); setCustomDays(''); } }}
                                disabled={!customDays}
                              >
                                OK
                              </Button>
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}
                      {!isAdmin && t.plan === 'premium' && onDowngrade && (
                        <Button size="sm" variant="ghost" className="hover:bg-destructive/10 hover:text-destructive" disabled={isDowngrading}
                          onClick={() => onDowngrade(t.user_id)}
                        >
                          <ArrowDownCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile View: Cards */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground bg-card border border-dashed rounded-xl">
            Nenhum personal encontrado.
          </div>
        )}
        {filtered.map((t) => {
          const isNew = t.created_at ? isAfter(new Date(t.created_at), subHours(new Date(), 24)) : false;
          const isAdmin = t.role === 'admin';
          return (
            <div 
              key={t.user_id} 
              className={cn(
                "p-4 rounded-xl border border-border shadow-sm flex flex-col gap-4 transition-all active:ring-2 active:ring-primary/20",
                isNew ? "bg-blue-500/5 border-blue-500/20" : "bg-card"
              )}
              onClick={() => setSelectedTrainer(t)}
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1 max-w-[70%]">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base truncate">{t.full_name || 'Sem Nome'}</span>
                    {isNew && (
                      <Badge className="bg-blue-500 text-white animate-pulse text-[8px] h-3.5 px-1 leading-none border-none">
                        NOVO
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{t.email}</p>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2" onClick={(e) => e.stopPropagation()}>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => setSelectedTrainer(t)}>
                      <Eye className="h-4 w-4 mr-2" /> Ficha Completa
                    </DropdownMenuItem>
                    {!isAdmin && onAddDays && (
                      <>
                        <DropdownMenuSeparator />
                        {[7, 15, 30].map(d => (
                          <DropdownMenuItem key={d} onClick={(e) => { e.stopPropagation(); onAddDays(t.user_id, d); }}>
                            <CalendarPlus className="h-4 w-4 mr-2 text-emerald-500" /> +{d} dias premium
                          </DropdownMenuItem>
                        ))}
                      </>
                    )}
                    {!isAdmin && t.plan === 'premium' && onDowngrade && (
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDowngrade(t.user_id); }}>
                        <ArrowDownCircle className="h-4 w-4 mr-2 text-amber-500" /> Rebaixar p/ Free
                      </DropdownMenuItem>
                    )}
                    {onConfirmPix && t.sub_status === 'pending_pix' && (
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onConfirmPix(t.user_id); }}>
                        <CreditCard className="h-4 w-4 mr-2 text-amber-500" /> Confirmar PIX
                      </DropdownMenuItem>
                    )}
                    {onDelete && !isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                          onClick={(e) => { e.stopPropagation(); onDelete(t.user_id); }}
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Excluir Conta
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border/50">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Plano & Status</p>
                  <div className="flex flex-wrap gap-1.5">
                    {isAdmin ? (
                      <Badge className="bg-purple-500/10 text-purple-500 border-none h-5 text-[10px]">ADMIN</Badge>
                    ) : (
                      <Badge variant={t.plan === 'premium' ? 'default' : 'secondary'} className={cn(
                        "h-5 text-[10px] border-none",
                        t.plan === 'premium' ? "bg-amber-500 shadow-none text-white" : "bg-muted text-muted-foreground"
                      )}>
                        {t.plan === 'premium' ? 'PREMIUM' : 'FREE'}
                      </Badge>
                    )}
                    <Badge className={cn(
                      "h-5 text-[10px] border-none shadow-none",
                      t.sub_status === 'active' ? "bg-emerald-500/10 text-emerald-500" : 
                      t.sub_status === 'blocked' ? "bg-destructive/10 text-destructive" :
                      "bg-amber-500/10 text-amber-500"
                    )}>
                      {t.sub_status === 'active' ? 'Ativo' : t.sub_status === 'blocked' ? 'Bloqueado' : 'Pendente'}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-1 text-right">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Impacto</p>
                  <div className="flex items-center justify-end gap-1.5">
                    <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-black text-sm">{t.active_students}</span>
                    <span className="text-[10px] text-muted-foreground font-medium">alunos</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
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
