import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTrainerStudents, useTrainerSubscriptionDetails, TrainerOverview, useAdminMutations } from "@/hooks/useAdminData";
import { Skeleton } from "@/components/ui/skeleton";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Mail, Calendar, Users, Shield, CreditCard, Ban, CheckCircle, Trash2, Plus, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface TrainerDetailsModalProps {
  trainer: TrainerOverview | null;
  isOpen: boolean;
  onClose: () => void;
  onBlock?: (trainerId: string, blocked: boolean) => void;
  isBlocking?: boolean;
  onConfirmPix?: (trainerId: string) => void;
  isConfirmingPix?: boolean;
  onDelete?: (trainerId: string) => void;
  isDeleting?: boolean;
}

export const TrainerDetailsModal = ({ 
  trainer, 
  isOpen, 
  onClose,
  onBlock,
  isBlocking,
  onConfirmPix,
  isConfirmingPix,
  onDelete,
  isDeleting
}: TrainerDetailsModalProps) => {
  const { data: students, isLoading: isLoadingStudents } = useTrainerStudents(trainer?.user_id || null);
  const { data: subDetails, isLoading: isLoadingSub } = useTrainerSubscriptionDetails(trainer?.user_id || null);
  const { addPremiumDays } = useAdminMutations();

  const handleAddDays = (days: number) => {
    addPremiumDays.mutate({ trainerId: trainer!.user_id, days }, {
      onSuccess: () => toast.success(`${days} dias de Premium adicionados!`),
      onError: () => toast.error('Erro ao adicionar dias')
    });
  };

  if (!trainer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden bg-background">
        
        {/* HEADER & QUICK ACTIONS */}
        <div className="p-6 border-b bg-card/50 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-border shadow-sm">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${trainer.full_name}`} />
              <AvatarFallback>{trainer.full_name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-2xl font-black">{trainer.full_name}</DialogTitle>
              <DialogDescription className="text-sm flex items-center gap-2 mt-1">
                <Mail className="h-3.5 w-3.5" /> {trainer.email}
              </DialogDescription>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {trainer.sub_status === 'pending_pix' && onConfirmPix && (
              <Button size="sm" variant="outline" className="text-amber-500 border-amber-500/30 hover:bg-amber-500/10" 
                      onClick={() => onConfirmPix(trainer.user_id)} disabled={isConfirmingPix}>
                <CreditCard className="h-4 w-4 mr-1" /> Confirmar PIX
              </Button>
            )}
            
            {onBlock && (
              trainer.sub_status === 'blocked' ? (
                <Button size="sm" variant="outline" onClick={() => onBlock(trainer.user_id, false)} disabled={isBlocking}>
                  <CheckCircle className="h-4 w-4 mr-1" /> Desbloquear
                </Button>
              ) : (
                <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10 border-destructive/30" 
                        onClick={() => onBlock(trainer.user_id, true)} disabled={isBlocking}>
                  <Ban className="h-4 w-4 mr-1" /> Bloquear
                </Button>
              )
            )}

            {onDelete && (
                <Button size="sm" variant="ghost" className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive" 
                        onClick={() => onDelete(trainer.user_id)} disabled={isDeleting}>
                  <Trash2 className="h-4 w-4" />
                </Button>
            )}
          </div>
        </div>

        {/* CONTENT & TABS */}
        <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
          <div className="px-6 pt-4 border-b">
            <TabsList className="bg-muted/50 w-full justify-start rounded-b-none border-b-0">
              <TabsTrigger value="overview" className="flex-1 sm:flex-none">Visão Geral</TabsTrigger>
              <TabsTrigger value="students" className="flex-1 sm:flex-none">Alunos ({trainer.active_students})</TabsTrigger>
              <TabsTrigger value="finance" className="flex-1 sm:flex-none">Histórico</TabsTrigger>
              <TabsTrigger value="manage_sub" className="flex-1 sm:flex-none bg-primary/10 text-primary">Gerenciar Plano</TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 p-6">
            <TabsContent value="overview" className="m-0 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-xl bg-card shadow-sm space-y-2">
                    <div className="flex items-center justify-between text-muted-foreground text-sm">
                        <span className="flex items-center gap-2"><Shield className="h-4 w-4" /> Status</span>
                    </div>
                    <div>
                        {trainer.sub_status === 'blocked' ? (
                            <Badge variant="destructive" className="mt-1">Bloqueado</Badge>
                        ) : trainer.sub_status === 'pending_pix' ? (
                            <Badge className="mt-1 bg-amber-500/20 text-amber-500 hover:bg-amber-500/30">PIX Pendente</Badge>
                        ) : (
                            <Badge className="mt-1 bg-primary/20 text-primary hover:bg-primary/30">Ativo</Badge>
                        )}
                    </div>
                  </div>

                  <div className="p-4 border rounded-xl bg-card shadow-sm space-y-2">
                    <div className="flex items-center justify-between text-muted-foreground text-sm">
                        <span className="flex items-center gap-2"><CreditCard className="h-4 w-4" /> Plano Atual</span>
                    </div>
                    <div className="font-bold text-lg capitalize">{trainer.plan === 'premium' ? <span className="text-amber-500">Premium ✨</span> : 'Gratuito'}</div>
                  </div>

                  <div className="p-4 border rounded-xl bg-card shadow-sm space-y-2">
                    <div className="flex items-center justify-between text-muted-foreground text-sm">
                        <span className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Na plataforma desde</span>
                    </div>
                    <div className="font-bold text-lg">
                        {trainer.created_at ? format(new Date(trainer.created_at), "MMM yyyy", { locale: ptBR }) : '-'}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-dashed bg-muted/20 text-sm text-muted-foreground">
                    <p><strong>Nota do Sistema:</strong> Esta é a Visão 360º. Utilize as ações no cabeçalho para gerenciar os acessos deste treinador. Alterações no plano Premium manual entram em vigor imediatamente.</p>
                </div>
            </TabsContent>

            <TabsContent value="students" className="m-0 space-y-4">
               {isLoadingStudents ? (
                     <div className="space-y-3">
                        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
                     </div>
                ) : students?.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground bg-card/30 rounded-xl border border-dashed">
                        Nenhum aluno cadastrado por este treinador ainda.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {students?.map(student => (
                            <div key={student.id} className="flex items-center justify-between p-4 rounded-xl border bg-card/50 hover:border-primary/30 transition-colors">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-10 w-10 border shadow-sm">
                                        <AvatarImage src={student.avatar_url || undefined} />
                                        <AvatarFallback>{student.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-bold text-sm">{student.name}</p>
                                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                                            {student.email} 
                                            {student.is_consulting && <Badge variant="secondary" className="text-[9px] h-4 px-1">Consultoria</Badge>}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <Badge variant="outline" className={student.status === 'active' ? 'bg-green-500/10 text-green-500 border-green-500/20' : ''}>
                                        {student.status === 'active' ? 'Ativo' : 'Inativo'}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </TabsContent>

            <TabsContent value="finance" className="m-0 space-y-4">
                {isLoadingSub ? (
                     <Skeleton className="h-48 rounded-xl" />
                ) : subDetails ? (
                    <div className="p-6 border rounded-xl bg-card shadow-sm space-y-6">
                        <div className="flex items-center justify-between border-b pb-4">
                            <div>
                                <h4 className="font-bold text-lg flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary" /> Ficha Financeira</h4>
                                <p className="text-xs text-muted-foreground">ID da Assinatura: {subDetails.id.split('-')[0]}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-muted-foreground">Valor Mensal</p>
                                <p className="font-black text-xl text-emerald-500">R$ {subDetails.price || '0,00'}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 text-sm gap-y-4">
                            <div>
                                <p className="text-muted-foreground mb-1">Início do Ciclo Atual</p>
                                <p className="font-medium">
                                    {subDetails.started_at ? format(new Date(subDetails.started_at), "dd 'de' MMM, yyyy", { locale: ptBR }) : '-'}
                                </p>
                            </div>
                            <div>
                                <p className="text-muted-foreground mb-1">Próximo Vencimento</p>
                                <p className="font-medium">
                                    {subDetails.expires_at ? format(new Date(subDetails.expires_at), "dd 'de' MMM, yyyy", { locale: ptBR }) : '-'}
                                </p>
                            </div>
                            <div>
                                <p className="text-muted-foreground mb-1">Status de Faturamento</p>
                                <Badge variant="outline" className={subDetails.status === 'active' ? 'border-primary text-primary' : 'border-destructive text-destructive'}>
                                    {subDetails.status === 'active' ? 'Em dia' : subDetails.status.toUpperCase()}
                                </Badge>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 text-muted-foreground bg-card/30 rounded-xl border border-dashed">
                        Nenhum detalhe de assinatura encontrado.
                    </div>
                )}
            </TabsContent>

            <TabsContent value="manage_sub" className="m-0 space-y-6">
                <div className="p-6 border rounded-xl bg-card shadow-sm space-y-6">
                    <div>
                        <h4 className="font-bold text-lg flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /> Controle de Acesso</h4>
                        <p className="text-sm text-muted-foreground">Adicione dias de acesso premium manualmente para este treinador.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Button 
                          variant="outline" 
                          className="flex flex-col h-auto py-4 hover:border-primary hover:bg-primary/5 group"
                          onClick={() => handleAddDays(7)}
                          disabled={addPremiumDays.isPending}
                        >
                            <span className="text-lg font-black group-hover:text-primary">+7 dias</span>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Uma semana</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex flex-col h-auto py-4 hover:border-primary hover:bg-primary/5 group"
                          onClick={() => handleAddDays(15)}
                          disabled={addPremiumDays.isPending}
                        >
                            <span className="text-lg font-black group-hover:text-primary">+15 dias</span>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Duas semanas</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex flex-col h-auto py-4 border-primary/50 bg-primary/5 hover:bg-primary/10 group"
                          onClick={() => handleAddDays(30)}
                          disabled={addPremiumDays.isPending}
                        >
                            <span className="text-lg font-black text-primary">+30 dias</span>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Um mês (Cortesia)</span>
                        </Button>
                    </div>

                    <div className="pt-4 border-t space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground flex items-center gap-2"><Clock className="h-4 w-4" /> Vencimento atual:</span>
                            <span className="font-bold">
                                {subDetails?.expires_at 
                                    ? format(new Date(subDetails.expires_at), "dd 'de' MMM, yyyy", { locale: ptBR }) 
                                    : 'Ainda sem assinatura'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground flex items-center gap-2"><CreditCard className="h-4 w-4" /> Tipo de Plano:</span>
                            <Badge variant={trainer.plan === 'premium' ? 'default' : 'secondary'} className={trainer.plan === 'premium' ? 'bg-amber-500 hover:bg-amber-600' : ''}>
                                {trainer.plan === 'premium' ? 'PREMIUM' : 'FREE'}
                            </Badge>
                        </div>
                    </div>
                </div>

                <div className="p-4 rounded-xl border-amber-500/20 bg-amber-500/5 text-xs text-amber-600 flex items-start gap-3 leading-relaxed">
                    <Shield className="h-4 w-4 shrink-0 mt-0.5" />
                    <p>Ao adicionar dias, o sistema automaticamente definirá o plano como <strong>Premium</strong> e o status como <strong>Ativo</strong>. Se o treinador já possuir dias restantes, os novos dias serão somados à data de expiração atual.</p>
                </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
