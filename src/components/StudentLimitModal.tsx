import { useState } from 'react';
import { CreditCard, QrCode, Clock, Copy, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PREMIUM_PRICE_ID } from '@/hooks/useTrainerSubscription';
import { toast } from 'sonner';

interface StudentLimitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPendingPix?: boolean;
}

const PIX_KEY = 'seu-email@pix.com'; // Admin configura aqui
const PIX_VALUE = 'R$ 9,90/mês';

export const StudentLimitModal = ({ open, onOpenChange, isPendingPix }: StudentLimitModalProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPix, setShowPix] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleStripeCheckout = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId: PREMIUM_PRICE_ID },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (err: any) {
      toast.error('Erro ao iniciar pagamento: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePixRequest = async () => {
    try {
      const { error } = await supabase
        .from('trainer_subscriptions')
        .update({ status: 'pending_pix', plan: 'free' })
        .eq('trainer_id', user!.id);
      if (error) throw error;
      setShowPix(true);
      toast.success('Solicitação PIX registrada! Aguardando confirmação do admin.');
    } catch (err: any) {
      toast.error('Erro: ' + err.message);
    }
  };

  const copyPixKey = () => {
    navigator.clipboard.writeText(PIX_KEY);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-center">
            {isPendingPix ? '⏳ Pagamento PIX Pendente' : '🚀 Faça o Upgrade'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {isPendingPix
              ? 'Seu pagamento PIX está sendo verificado pelo administrador.'
              : 'Você atingiu o limite de 5 alunos ativos no plano gratuito. Faça upgrade para ter alunos ilimitados!'}
          </DialogDescription>
        </DialogHeader>

        {isPendingPix ? (
          <div className="flex items-center gap-2 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <Clock className="h-5 w-5 text-amber-400 shrink-0" />
            <p className="text-sm text-amber-300">Aguardando confirmação do admin. Você será notificado quando o pagamento for aprovado.</p>
          </div>
        ) : showPix ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-muted/50 border border-border/50 text-center space-y-2">
              <QrCode className="h-12 w-12 mx-auto text-primary" />
              <p className="text-sm font-semibold">Chave PIX</p>
              <div className="flex items-center gap-2 justify-center">
                <code className="text-xs bg-background px-3 py-1.5 rounded-lg">{PIX_KEY}</code>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyPixKey}>
                  {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
              <p className="text-lg font-bold text-primary">{PIX_VALUE}</p>
              <p className="text-xs text-muted-foreground">Após o pagamento, o admin confirmará e seu plano será atualizado.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 mt-2">
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
              <p className="text-sm font-semibold text-primary">Plano Premium</p>
              <p className="text-2xl font-bold mt-1">R$ 9,90<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
              <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                <li>✓ Alunos ativos ilimitados</li>
                <li>✓ Acesso completo a todas as funcionalidades</li>
              </ul>
            </div>

            <Button onClick={handleStripeCheckout} disabled={loading}
              className="w-full h-11 rounded-xl gradient-primary text-primary-foreground font-semibold">
              <CreditCard className="h-4 w-4 mr-2" />
              {loading ? 'Redirecionando...' : 'Assinar com Cartão'}
            </Button>

            <Button variant="outline" onClick={handlePixRequest}
              className="w-full h-11 rounded-xl">
              <QrCode className="h-4 w-4 mr-2" />
              Pagar via PIX
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
