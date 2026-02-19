import { AdminLayout } from '@/components/AdminLayout';
import { StudentSearch } from '@/components/admin/StudentSearch';

const AdminStudents = () => {
  return (
    <AdminLayout>
      <div className="space-y-6 flex flex-col h-full">
        <div>
          <h1 className="text-2xl font-bold">Busca Global de Alunos</h1>
          <p className="text-sm text-muted-foreground mt-1">Localize e visualize detalhes de qualquer aluno da plataforma</p>
        </div>

        <div className="flex-1 min-h-0 bg-card border rounded-2xl p-6 shadow-sm">
          <StudentSearch />
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminStudents;
