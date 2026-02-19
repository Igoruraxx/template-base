import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useTrainerSubscription } from '@/hooks/useTrainerSubscription';
import { ChevronLeft, Crown, Clock, Shield, CheckCircle, Smartphone } from 'lucide-react';
import { openWhatsApp } from '@/lib/whatsapp';

const Subscription = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { plan, isPremium, isPendingPix, status } = useTrainerSubscription();

  return (
    <AppLayout>
      <div className="px-4 pt-12 pb-6 max-w-lg mx-auto">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="icon" className="mr-2" onClick={() => navigate('/profile')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Minha Assinatura</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Gerencie seu plano na plataforma</p>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6 mt-4 relative overflow-hidden">
          {isPremium && (
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
          )}
          
          <div className="flex flex-col items-center text-center space-y-4 relative z-10">
            <div className={`h-20 w-20 rounded-full flex items-center justify-center ${isPremium ? 'bg-yellow-500/20 text-yellow-500' : 'bg-primary/20 text-primary'}`}>
              {isPremium ? <Crown className="h-10 w-10" /> : <Shield className="h-10 w-10" />}
            </div>
            
            <div>
              <h2 className="text-2xl font-black mb-1">Plano {isPremium ? 'Premium' : 'Gratuito'}</h2>
              <div className="flex justify-center gap-2 mt-2">
                 {isPendingPix && (
                    <Badge className="bg-amber-500/20 text-amber-500 hover:bg-amber-500/30">
                        PIX Pendente
                    </Badge>
                 )}
                 <Badge variant={isPremium ? 'default' : 'secondary'} className={isPremium ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : ''}>
                    {isPremium ? 'Ilimitado' : 'Até 5 alunos'}
                 </Badge>
              </div>
            </div>

            {isPremium ? (
              <div className="pt-4 space-y-3 w-full">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-card border shadow-sm text-left">
                  <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">Tudo liberado</p>
                    <p className="text-xs text-muted-foreground">Você pode adicionar quantos alunos quiser na plataforma.</p>
                  </div>
                </div>
                
                <div className="pt-4 border-t w-full text-left space-y-3">
                   <h3 className="font-semibold text-sm">Precisa de ajuda?</h3>
                   <Button variant="outline" className="w-full justify-start h-12" onClick={() => openWhatsApp('5511999999999', 'Olá Suporte IFT, sou assinante Premium e preciso de ajuda.')}>
                     <Smartphone className="h-4 w-4 mr-2" />
                     Falar com Suporte VIP
                   </Button>
                </div>
              </div>
            ) : (
              <div className="pt-4 space-y-4 w-full">
                <div className="bg-muted/30 border border-border/50 rounded-xl p-4 text-left">
                    <h3 className="font-bold text-lg text-primary mb-2">Por que ser Premium?</h3>
                    <ul className="text-sm space-y-2 text-muted-foreground">
                        <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" /> Alunos ilimitados no aplicativo</li>
                        <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" /> Avaliações físicas e relatórios</li>
                        <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" /> Gestão de cobrança (Financeiro)</li>
                    </ul>
                </div>
                
                <div className="bg-card border shadow-lg rounded-xl p-6 text-center">
                    <p className="text-4xl font-black text-primary mb-1">R$ 9,90<span className="text-sm font-medium text-muted-foreground">/mês</span></p>
                    <p className="text-xs text-muted-foreground mb-6">Pagamento via PIX. Ativação imediata.</p>
                    
                    {isPendingPix ? (
                        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 text-sm">
                            <Clock className="h-5 w-5 mx-auto mb-2" />
                            <p className="font-semibold mb-1">Aguardando comprovação</p>
                            <p className="text-xs opacity-80 mb-3">Seu PIX está em análise. Envie o comprovante via WhatsApp para liberar agora.</p>
                            <Button size="sm" variant="outline" className="w-full bg-amber-500 text-white border-none hover:bg-amber-600" 
                                    onClick={() => openWhatsApp('5511999999999', `Olá! Fiz um PIX para o plano Premium do meu email ${user?.email}. Segue o comprovante.`)}>
                                Enviar Comprovante
                            </Button>
                        </div>
                    ) : (
                        <Button className="w-full h-12 text-md font-bold gradient-primary shadow-xl shadow-primary/25 rounded-xl hover:scale-[1.02] transition-transform"
                                onClick={() => openWhatsApp('5511999999999', `Olá! Quero fazer o upgrade da minha conta (${user?.email}) para o plano Premium via PIX.`)}>
                            <Crown className="h-5 w-5 mr-2" /> Fazer Upgrade via PIX
                        </Button>
                    )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Subscription;
