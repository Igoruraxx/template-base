import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useRef } from 'react';

export const usePayments = (studentId?: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['payments', user?.id, studentId],
    queryFn: async () => {
      let query = supabase.from('payments').select('*, students(name, color, phone, payment_due_day, plan_value)').order('reference_month', { ascending: false });
      if (studentId) query = query.eq('student_id', studentId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useCreatePayment = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (payment: {
      student_id: string; amount: number; reference_month: string;
      status?: string; payment_method?: string; notes?: string;
    }) => {
      const { data, error } = await supabase.from('payments').insert({
        ...payment,
        trainer_id: user!.id,
        paid_at: payment.status === 'paid' ? new Date().toISOString() : null,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payments'] }),
  });
};

export const useUpdatePayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; status?: string; amount?: number; notes?: string; payment_method?: string }) => {
      const payload: any = { ...updates };
      if (updates.status === 'paid') payload.paid_at = new Date().toISOString();
      const { data, error } = await supabase.from('payments').update(payload).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payments'] }),
  });
};

export const useDeletePayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('payments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payments'] }),
  });
};

// Auto-generate pending payments for active students missing a record this month
export const useAutoGeneratePayments = (
  viewMonthStr: string,
  students: any[] | undefined,
  payments: any[] | undefined,
) => {
  const createPayment = useCreatePayment();
  const generated = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!students || !payments) return;

    const activeWithPlan = students.filter(
      (s) => s.status === 'active' && s.plan_value && s.payment_due_day,
    );

    const existingStudentIds = new Set(
      payments
        .filter((p: any) => p.reference_month === viewMonthStr)
        .map((p: any) => p.student_id),
    );

    const key = viewMonthStr;
    activeWithPlan.forEach((s) => {
      const uid = `${key}-${s.id}`;
      if (!existingStudentIds.has(s.id) && !generated.current.has(uid)) {
        generated.current.add(uid);
        createPayment.mutate({
          student_id: s.id,
          amount: Number(s.plan_value),
          reference_month: viewMonthStr,
          status: 'pending',
        });
      }
    });
  }, [viewMonthStr, students, payments]);
};

// Auto-mark overdue payments whose due day has passed
export const useMarkOverdue = (
  viewMonthStr: string,
  payments: any[] | undefined,
  students: any[] | undefined,
) => {
  const updatePayment = useUpdatePayment();
  const marked = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!payments || !students) return;

    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    // Only auto-mark overdue for the current month
    if (viewMonthStr !== currentMonthStr) return;

    const today = now.getDate();
    const studentMap = new Map(students.map((s) => [s.id, s]));

    payments
      .filter((p: any) => p.reference_month === viewMonthStr && p.status === 'pending')
      .forEach((p: any) => {
        const student = studentMap.get(p.student_id);
        if (student?.payment_due_day && student.payment_due_day < today && !marked.current.has(p.id)) {
          marked.current.add(p.id);
          updatePayment.mutate({ id: p.id, status: 'overdue' });
        }
      });
  }, [viewMonthStr, payments, students]);
};
