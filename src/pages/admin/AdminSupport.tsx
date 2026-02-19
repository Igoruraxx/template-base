import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HeadsetIcon } from 'lucide-react';
import { StudentSearch } from '@/components/admin/StudentSearch';

const AdminSupport = () => {
  return (
    <AdminLayout>
      <div className="space-y-6 h-full flex flex-col">
        <div>
          <h1 className="text-2xl font-bold">Suporte</h1>
          <p className="text-sm text-muted-foreground mt-1">Busque alunos para visualizar detalhes e auxiliar no suporte</p>
        </div>
        
        <div className="flex-1 min-h-0">
             <StudentSearch />
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSupport;
