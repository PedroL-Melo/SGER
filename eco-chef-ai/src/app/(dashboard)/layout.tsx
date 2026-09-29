import { Sidebar } from '@/components/Sidebar';
import { AuthGuard } from '@/components/AuthGuard';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-zinc-950 flex text-zinc-100">
        <Sidebar />
        <div className="flex-1 ml-72">
          {children}
        </div>
      </div>
    </AuthGuard>
  );
}
