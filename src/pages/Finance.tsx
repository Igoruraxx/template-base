import { AppLayout } from '@/components/AppLayout';
import { motion } from 'framer-motion';
import { DollarSign } from 'lucide-react';

const Finance = () => (
  <AppLayout>
    <div className="px-4 pt-12 pb-6 max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
        <p className="text-muted-foreground text-sm mt-1">Controle de pagamentos</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-2xl p-8 flex flex-col items-center justify-center text-center mt-6"
      >
        <DollarSign className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Em breve — Fase 6</p>
      </motion.div>
    </div>
  </AppLayout>
);

export default Finance;
