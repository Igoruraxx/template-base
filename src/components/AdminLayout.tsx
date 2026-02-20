import { LayoutDashboard, Users, CreditCard, HeadsetIcon, LogOut, GraduationCap, User } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const menuItems = [
  { title: 'Dashboard', url: '/admin', icon: LayoutDashboard },
  { title: 'Alunos', url: '/admin/students', icon: GraduationCap },
  { title: 'Treinadores', url: '/admin/users', icon: Users },
  { title: 'Cobranças', url: '/admin/billing', icon: CreditCard },
  { title: 'Suporte', url: '/admin/support', icon: HeadsetIcon },
];

export const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card">
        <div className="p-6 border-b border-border">
          <button 
            onClick={() => navigate('/admin')}
            className="text-left hover:opacity-80 transition-opacity"
          >
            <h1 className="text-xl font-bold font-heading text-gradient">FitAdmin</h1>
            <p className="text-xs text-muted-foreground mt-1">Painel Administrativo</p>
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.url}
              to={item.url}
              end={item.url === '/admin'}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
              activeClassName="bg-primary/10 text-primary font-medium"
            >
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-border space-y-4">
          <div className="flex items-center gap-3 px-2">
            <Avatar className="h-8 w-8 border border-border">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.email}`} />
              <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
            </Avatar>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold truncate">{user?.email?.split('@')[0]}</p>
              <p className="text-[10px] text-muted-foreground">Administrador</p>
            </div>
          </div>
          
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors w-full"
          >
            <LogOut className="h-4 w-4" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 pb-16 md:pb-0">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
          <button 
            onClick={() => navigate('/admin')}
            className="text-left font-bold font-heading text-lg text-gradient"
          >
            FitAdmin
          </button>
          
          <Avatar className="h-8 w-8 border border-border">
            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.email}`} />
            <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
          </Avatar>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card/90 backdrop-blur-lg border-t border-border flex items-center justify-around px-2 z-50">
        {menuItems.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            end={item.url === '/admin'}
            className="flex flex-col items-center justify-center flex-1 gap-1 text-muted-foreground transition-all active:scale-95 py-2"
            activeClassName="text-primary"
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium tracking-tight">
              {item.title}
            </span>
          </NavLink>
        ))}
        <button
          onClick={handleSignOut}
          className="flex flex-col items-center justify-center flex-1 gap-1 text-muted-foreground active:scale-95"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-[10px] font-medium tracking-tight">Sair</span>
        </button>
      </nav>
    </div>
  );
};
