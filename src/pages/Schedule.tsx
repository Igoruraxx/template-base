import { AppLayout } from '@/components/AppLayout';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';

const Schedule = () => (
  <AppLayout>
    <div className="px-4 pt-12 pb-6 max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold tracking-tight">Agenda</h1>
        <p className="text-muted-foreground text-sm mt-1">Suas sessões de treino</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-2xl p-8 flex flex-col items-center justify-center text-center mt-6"
      >
        <Calendar className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Em breve — Fase 3</p>
      </motion.div>
    </div>
  </AppLayout>
);

export default Schedule;
