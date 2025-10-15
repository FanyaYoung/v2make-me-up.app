import Header from '@/components/Header';
import AdminOrderManagement from '@/components/AdminOrderManagement';

export default function Admin() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      <Header />
      <AdminOrderManagement />
    </div>
  );
}