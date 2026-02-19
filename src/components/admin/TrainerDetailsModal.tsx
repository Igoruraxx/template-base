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
import { useTrainerStudents, TrainerOverview } from "@/hooks/useAdminData";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Mail, Calendar, Users, Shield, CreditCard } from "lucide-react";

interface TrainerDetailsModalProps {
  trainer: TrainerOverview | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TrainerDetailsModal = ({ trainer, isOpen, onClose }: TrainerDetailsModalProps) => {
  const { data: students, isLoading } = useTrainerStudents(trainer?.user_id || null);

  if (!trainer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-4 mb-2">
            <Avatar className="h-16 w-16 border-2 border-border">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${trainer.full_name}`} />
              <AvatarFallback>{trainer.full_name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-2xl">{trainer.full_name}</DialogTitle>
              <DialogDescription className="text-base flex items-center gap-2 mt-1">
                <Mail className="h-4 w-4" /> {trainer.email}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
          <div className="p-4 border rounded-lg bg-card space-y-2">
             <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Shield className="h-4 w-4" /> Status
             </div>
             <div className="flex gap-2">
                {trainer.sub_status === 'blocked' ? (
                    <Badge variant="destructive">Bloqueado</Badge>
                  ) : trainer.sub_status === 'pending_pix' ? (
                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">PIX Pendente</Badge>
                  ) : (
                    <Badge className="bg-primary/20 text-primary border-primary/30">Ativo</Badge>
                  )}
             </div>
          </div>

          <div className="p-4 border rounded-lg bg-card space-y-2">
             <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <CreditCard className="h-4 w-4" /> Plano
             </div>
             <div className="font-semibold text-lg capitalize">{trainer.plan}</div>
          </div>

          <div className="p-4 border rounded-lg bg-card space-y-2">
             <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Calendar className="h-4 w-4" /> Membro desde
             </div>
             <div className="font-semibold text-lg">
                {trainer.created_at ? format(new Date(trainer.created_at), "MMM yyyy", { locale: ptBR }) : '-'}
             </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col pt-4 border-t">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Users className="h-4 w-4" /> Alunos Vinculados ({trainer.active_students})
            </h3>
            
            <ScrollArea className="flex-1 -mr-4 pr-4">
                {isLoading ? (
                     <div className="space-y-2">
                        {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}
                     </div>
                ) : students?.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm bg-muted/20 rounded-lg border border-dashed">
                        Nenhum aluno cadastrado para este treinador.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {students?.map(student => (
                            <div key={student.id} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={student.avatar_url || undefined} />
                                        <AvatarFallback>{student.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium text-sm">{student.name}</p>
                                        <p className="text-xs text-muted-foreground">{student.email}</p>
                                    </div>
                                </div>
                                <Badge variant="outline" className={student.status === 'active' ? 'bg-green-500/10 text-green-500 border-green-500/20' : ''}>
                                    {student.status === 'active' ? 'Ativo' : 'Inativo'}
                                </Badge>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
