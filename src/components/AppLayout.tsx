import { BottomNav } from '@/components/BottomNav';

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-background pt-safe">
      <main className="pb-20">{children}</main>
      <BottomNav />
    </div>
  );
};
