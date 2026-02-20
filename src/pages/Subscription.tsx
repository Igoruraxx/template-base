import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useTrainerSubscription } from '@/hooks/useTrainerSubscription';
import { ChevronLeft, Crown, Clock, Shield, CheckCircle, Smartphone, CalendarDays, QrCode } from 'lucide-react';
import { openWhatsApp } from '@/lib/whatsapp';
import { differenceInDays, parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Subscription = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { plan, isPremium, isPendingPix, status, startedAt, expiresAt } = useTrainerSubscription();

  const daysRemaining = expiresAt ? Math.max(0, differenceInDays(parseISO(expiresAt), new Date())) : 0;
  const isExpiringSoon = daysRemaining <= 5 && isPremium;

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
              <div className="pt-4 space-y-4 w-full">
                
                {/* Status da Validade do Plano */}
                <div className={`p-4 rounded-xl border flex items-center gap-4 ${isExpiringSoon ? 'bg-rose-500/10 border-rose-500/30' : 'bg-card border-border/50'}`}>
                  <div className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center ${isExpiringSoon ? 'bg-rose-500/20 text-rose-500' : 'bg-primary/20 text-primary'}`}>
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className={`font-bold text-lg leading-tight ${isExpiringSoon ? 'text-rose-500' : ''}`}>
                      {daysRemaining} dias restantes
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      Válido até {expiresAt ? format(parseISO(expiresAt), "dd 'de' MMMM", { locale: ptBR }) : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                   <div className="bg-muted/30 border border-border/50 p-3 rounded-xl text-left">
                     <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Início do plano</p>
                     <p className="text-sm font-semibold">{startedAt ? format(parseISO(startedAt), "dd/MM/yyyy") : '-'}</p>
                   </div>
                   <div className="bg-muted/30 border border-border/50 p-3 rounded-xl text-left">
                     <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Vencimento</p>
                     <p className="text-sm font-semibold">{expiresAt ? format(parseISO(expiresAt), "dd/MM/yyyy") : '-'}</p>
                   </div>
                </div>

                {/* Área de Renovação / Benefícios */}
                <div className="flex items-center gap-3 p-4 rounded-xl bg-card border shadow-sm text-left">
                  <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">Tudo liberado</p>
                    <p className="text-xs text-muted-foreground">Você pode adicionar quantos alunos quiser na plataforma.</p>
                  </div>
                </div>

                {isExpiringSoon && (
                  <Button className="w-full h-12 text-md font-bold gradient-primary shadow-xl shadow-primary/25 rounded-xl hover:scale-[1.02] transition-transform animate-pulse"
                          onClick={() => openWhatsApp('5511999999999', `Olá! Quero renovar minha assinatura Premium (${user?.email}) via PIX.`)}>
                      <QrCode className="h-5 w-5 mr-2" /> Renovar via PIX
                  </Button>
                )}
                
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
                
                <div className="bg-card border shadow-lg rounded-xl p-6 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
                    
                    <p className="text-4xl font-black text-primary mb-1">R$ 9,90<span className="text-sm font-medium text-muted-foreground">/mês</span></p>
                    <p className="text-xs text-muted-foreground mb-6">Pague rápido via PIX. Ativação imediata sem burocracia de cartão.</p>
                    
                    {isPendingPix ? (
                        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-sm">
                            <Clock className="h-6 w-6 mx-auto mb-2 animate-pulse" />
                            <p className="font-bold mb-1">Pagamento em Análise</p>
                            <p className="text-xs opacity-80 mb-4">Seu PIX está sendo verificado. Envie o comprovante via WhatsApp para liberação expressa.</p>
                            <Button size="sm" variant="outline" className="w-full bg-amber-500 text-white border-none hover:bg-amber-600 shadow-lg shadow-amber-500/20" 
                                    onClick={() => openWhatsApp('5511999999999', `Olá! Fiz um PIX para o plano Premium do meu email ${user?.email}. Segue o comprovante.`)}>
                                Enviar Comprovante
                            </Button>
                        </div>
                    ) : (
                        <Button className="w-full h-14 text-md font-bold gradient-primary shadow-xl shadow-primary/25 rounded-xl hover:scale-[1.02] transition-transform active:scale-95 flex items-center justify-center gap-2"
                                onClick={() => openWhatsApp('5511999999999', `Olá! Quero fazer o upgrade da minha conta (${user?.email}) para o plano Premium via PIX.`)}>
                            <QrCode className="h-5 w-5" /> Fazer Upgrade via PIX
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
