import { AdminLayout } from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HeadsetIcon } from 'lucide-react';

const AdminSupport = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Suporte</h1>
          <p className="text-sm text-muted-foreground mt-1">Visualize dados de alunos para suporte técnico</p>
        </div>

        <Card className="border-border">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 rounded-full bg-primary/10 mb-4">
              <HeadsetIcon className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold text-lg">Módulo de Suporte</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              Aqui você poderá visualizar fotos de progresso e dados de bioimpedância dos alunos para fins de suporte técnico.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminSupport;
