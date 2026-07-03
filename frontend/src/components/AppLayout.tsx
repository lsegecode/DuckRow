/**
 * AppLayout — main layout wrapper with Sidebar + content area.
 */

import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function AppLayout() {
  return (
    <div className="flex min-h-screen bg-obsidian">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 animate-fade-in">
        <Outlet />
      </main>
    </div>
  );
}
