import { AppLayout } from '@/components/AppLayout';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';

const Profile = () => {
  const { user, signOut } = useAuth();

  return (
    <AppLayout>
      <div className="px-4 pt-12 pb-6 max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold tracking-tight">Perfil</h1>
          <p className="text-muted-foreground text-sm mt-1">Suas configurações</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-6 mt-6"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
              <User className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold">
                {user?.user_metadata?.full_name || 'Treinador'}
              </p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={signOut}
            className="w-full rounded-xl h-11 text-destructive hover:text-destructive"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair da conta
          </Button>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Profile;
