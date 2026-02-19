import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search, User, CreditCard, Calendar, Dumbbell, ShieldAlert, Mail, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminData } from "@/hooks/useAdminData";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

export const StudentSearch = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  const { trainersQuery } = useAdminData();
  const trainers = trainersQuery.data ?? [];

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: students, isLoading } = useQuery({
    queryKey: ["admin-students-search", debouncedTerm],
    queryFn: async () => {
      if (!debouncedTerm || debouncedTerm.length < 3) return [];
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .or(`name.ilike.%${debouncedTerm}%,email.ilike.%${debouncedTerm}%`)
        .limit(20);
      
      if (error) {
        toast.error("Erro ao buscar alunos");
        throw error;
      }
      return data;
    },
    enabled: debouncedTerm.length >= 3,
  });

  const getTrainerName = (trainerId: string) => {
    const trainer = trainers.find(t => t.user_id === trainerId);
    return trainer?.full_name || "Desconhecido"; // Fallback se não encontrar
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-500">Ativo</Badge>;
      case 'inactive': return <Badge variant="destructive">Inativo</Badge>;
      case 'payment_pending': return <Badge className="text-yellow-800 bg-yellow-100 border-yellow-300">Pagamento Pendente</Badge>;
      default: return <Badge variant="outline">{status || 'Sem Status'}</Badge>;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
      {/* Coluna da Esquerda: Busca e Lista */}
      <div className="lg:col-span-1 flex flex-col gap-4 border-r pr-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar aluno por nome ou email..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (e.target.value.length < 3) setSelectedStudent(null);
            }}
          />
        </div>
        
        <ScrollArea className="flex-1 -mr-4 pr-4">
          <div className="space-y-2">
            {isLoading ? (
              [1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)
            ) : students?.length === 0 && debouncedTerm.length >= 3 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">Nenhum aluno encontrado.</div>
            ) : !debouncedTerm || debouncedTerm.length < 3 ? (
               <div className="text-center py-8 text-muted-foreground text-sm">Digite 3 caracteres para buscar.</div>
            ) : (
              students?.map(student => (
                <div
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent/50 ${
                    selectedStudent?.id === student.id ? 'bg-accent border-primary' : 'bg-card'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={student.avatar_url || undefined} />
                      <AvatarFallback>{student.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="overflow-hidden">
                      <p className="font-medium truncate">{student.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Coluna da Direita: Detalhes */}
      <div className="lg:col-span-2">
        {selectedStudent ? (
          <Card className="h-full border-0 shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-border">
                    <AvatarImage src={selectedStudent.avatar_url} />
                    <AvatarFallback className="text-xl">{selectedStudent.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-2xl">{selectedStudent.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Mail className="h-3.5 w-3.5" /> {selectedStudent.email || 'Sem email'}
                    </CardDescription>
                  </div>
                </div>
                {getStatusBadge(selectedStudent.status)}
              </div>
            </CardHeader>
            <CardContent className="px-0 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4 space-y-3">
                  <h3 className="font-semibold flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-primary" /> Dados do Treinador
                  </h3>
                  <div className="text-sm">
                    <p className="text-muted-foreground">Responsável</p>
                    <p className="font-medium">{getTrainerName(selectedStudent.trainer_id)}</p>
                  </div>
                </Card>

                <Card className="p-4 space-y-3">
                  <h3 className="font-semibold flex items-center gap-2 text-sm">
                    <CreditCard className="h-4 w-4 text-primary" /> Plano e Pagamento
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Plano</p>
                      <p className="font-medium capitalize">{selectedStudent.plan_type || 'Não definido'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Vencimento</p>
                      <p className="font-medium">Dia {selectedStudent.payment_due_day || '--'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Valor</p>
                      <p className="font-medium">
                        {selectedStudent.plan_value 
                          ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedStudent.plan_value)
                          : '--'}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 space-y-3">
                  <h3 className="font-semibold flex items-center gap-2 text-sm">
                    <Dumbbell className="h-4 w-4 text-primary" /> Treino
                  </h3>
                  <div className="text-sm">
                    <p className="text-muted-foreground">Objetivo</p>
                    <p className="font-medium">{selectedStudent.goal || 'Não informado'}</p>
                  </div>
                  <div className="text-sm">
                    <p className="text-muted-foreground">Sessões/Semana</p>
                    <p className="font-medium">{selectedStudent.sessions_per_week || 0}</p>
                  </div>
                </Card>
                
                 <Card className="p-4 space-y-3">
                  <h3 className="font-semibold flex items-center gap-2 text-sm">
                    <ShieldAlert className="h-4 w-4 text-primary" /> Sistema
                  </h3>
                  <div className="text-sm">
                    <p className="text-muted-foreground">ID do Aluno</p>
                    <p className="font-mono text-xs">{selectedStudent.id}</p>
                  </div>
                   <div className="text-sm">
                    <p className="text-muted-foreground">Criado em</p>
                    <p className="font-medium">
                        {selectedStudent.created_at ? format(new Date(selectedStudent.created_at), "dd/MM/yyyy", { locale: ptBR }) : '--'}
                    </p>
                  </div>
                </Card>
              </div>

               {selectedStudent.notes && (
                <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold mb-2">Observações</h4>
                    <p className="text-sm text-muted-foreground">{selectedStudent.notes}</p>
                </div>
               )}

            </CardContent>
          </Card>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-8 border rounded-lg border-dashed">
            <User className="h-12 w-12 mb-4 opacity-20" />
            <h3 className="font-medium text-lg">Selecione um aluno</h3>
            <p className="text-sm max-w-sm mt-2">
              Utilize a busca ao lado para encontrar um aluno e visualizar seus detalhes completos.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
