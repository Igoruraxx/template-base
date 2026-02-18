import { AdminLayout } from '@/components/AdminLayout';
import { SummaryCards } from '@/components/admin/SummaryCards';
import { BillingCharts } from '@/components/admin/BillingCharts';
import { useAdminData } from '@/hooks/useAdminData';
import { Skeleton } from '@/components/ui/skeleton';

const AdminDashboard = () => {
  const { trainersQuery } = useAdminData();
  const trainers = trainersQuery.data ?? [];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Visão geral da plataforma</p>
        </div>

        {trainersQuery.isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}
          </div>
        ) : (
          <>
            <SummaryCards trainers={trainers} />
            <BillingCharts trainers={trainers} />
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
