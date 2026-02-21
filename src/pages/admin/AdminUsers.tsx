import { AdminLayout } from '@/components/AdminLayout';
import { TrainersTable } from '@/components/admin/TrainersTable';
import { useAdminData, useAdminMutations } from '@/hooks/useAdminData';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const AdminUsers = () => {
  const { trainersQuery, blockTrainer, confirmPix, deleteTrainer } = useAdminData();
  const { addPremiumDays, downgradePlan } = useAdminMutations();
  const trainers = trainersQuery.data ?? [];

  const handleBlock = (trainerId: string, blocked: boolean) => {
    blockTrainer.mutate(
      { trainerId, blocked },
      {
        onSuccess: () => toast.success(blocked ? 'Acesso bloqueado' : 'Acesso desbloqueado'),
        onError: () => toast.error('Erro ao atualizar status'),
      }
    );
  };

  const handleConfirmPix = (trainerId: string) => {
    confirmPix.mutate(trainerId, {
      onSuccess: () => toast.success('PIX confirmado! Plano Premium ativado.'),
      onError: () => toast.error('Erro ao confirmar PIX'),
    });
  };

  const handleDelete = (trainerId: string) => {
    if (!confirm('TEM CERTEZA? Esta ação removerá o treinador e TODOS os seus alunos permanentemente.')) return;
    
    deleteTrainer.mutate(trainerId, {
      onSuccess: () => toast.success('Treinador removido com sucesso'),
      onError: (err: any) => toast.error('Erro ao remover: ' + err.message),
    });
  };

  const handleAddDays = (trainerId: string, days: number) => {
    addPremiumDays.mutate(
      { trainerId, days },
      {
        onSuccess: () => toast.success(`+${days} dias premium adicionados!`),
        onError: () => toast.error('Erro ao adicionar dias'),
      }
    );
  };

  const handleDowngrade = (trainerId: string) => {
    if (!confirm('Rebaixar para plano gratuito? O treinador perderá acesso premium.')) return;
    downgradePlan.mutate(trainerId, {
      onSuccess: () => toast.success('Plano rebaixado para gratuito'),
      onError: () => toast.error('Erro ao rebaixar plano'),
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Gestão de Usuários</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie os personal trainers da plataforma</p>
        </div>

        {trainersQuery.isLoading ? (
          <Skeleton className="h-64 rounded-lg" />
        ) : (
          <TrainersTable 
            trainers={trainers} 
            onBlock={handleBlock} 
            isBlocking={blockTrainer.isPending}
            onConfirmPix={handleConfirmPix} 
            isConfirmingPix={confirmPix.isPending}
            onDelete={handleDelete}
            isDeleting={deleteTrainer.isPending}
            onAddDays={handleAddDays}
            isAddingDays={addPremiumDays.isPending}
            onDowngrade={handleDowngrade}
            isDowngrading={downgradePlan.isPending}
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
