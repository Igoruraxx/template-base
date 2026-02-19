import { useLocation, useNavigate } from 'react-router-dom';
import { Users, Calendar, Camera, User, DollarSign, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();
  
  if (loading || !user) return null;

  const navItems = [
    { icon: Users, label: 'Alunos', path: '/students' },
    { icon: Camera, label: 'Progresso', path: '/progress' },
    { icon: Calendar, label: 'Agenda', path: '/' },
    { icon: DollarSign, label: 'Financeiro', path: '/finance' },
    { icon: User, label: 'Perfil', path: '/profile' },
  ];

  // Adiciona item Admin se for admin de forma segura
  if (isAdmin) {
    navItems.push({ icon: ShieldCheck, label: 'Admin', path: '/admin' });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/50 pb-safe">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path === '/admin' && location.pathname.startsWith('/admin'));
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 w-16 h-full relative transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full gradient-primary"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

