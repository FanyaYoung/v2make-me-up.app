import Header from '@/components/Header';
import AdminOrderManagement from '@/components/AdminOrderManagement';
import AuthGuard from '@/components/AuthGuard';

export default function Admin() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
        <Header />
        <AdminOrderManagement />
      </div>
    </AuthGuard>
  );
}