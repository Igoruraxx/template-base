import { LayoutDashboard, Users, CreditCard, HeadsetIcon, LogOut } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const menuItems = [
  { title: 'Dashboard', url: '/admin', icon: LayoutDashboard },
  { title: 'Usuários', url: '/admin/users', icon: Users },
  { title: 'Cobranças', url: '/admin/billing', icon: CreditCard },
  { title: 'Suporte', url: '/admin/support', icon: HeadsetIcon },
];

export const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const { signOut } = useAuth();
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
          <h1 className="text-xl font-bold font-heading text-gradient">FitAdmin</h1>
          <p className="text-xs text-muted-foreground mt-1">Painel Administrativo</p>
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

        <div className="p-4 border-t border-border">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors w-full"
          >
            <LogOut className="h-4 w-4" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="flex flex-col flex-1">
        <header className="md:hidden flex items-center gap-2 p-4 border-b border-border bg-card overflow-x-auto">
          {menuItems.map((item) => (
            <NavLink
              key={item.url}
              to={item.url}
              end={item.url === '/admin'}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground whitespace-nowrap hover:bg-accent/10"
              activeClassName="bg-primary/10 text-primary font-medium"
            >
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
            </NavLink>
          ))}
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
