import { AdminLayout } from '@/components/AdminLayout';
import { TrainersTable } from '@/components/admin/TrainersTable';
import { useAdminData } from '@/hooks/useAdminData';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const AdminUsers = () => {
  const { trainersQuery, blockTrainer } = useAdminData();
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
          <TrainersTable trainers={trainers} onBlock={handleBlock} isBlocking={blockTrainer.isPending} />
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
