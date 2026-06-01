import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:mr-[280px] transition-all duration-300">
        <Header />
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
