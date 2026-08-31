import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { LiveCallToast } from '../../hooks/useLiveCallListener';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background bg-dot-grid text-neutral-txt flex flex-col">
      <Header/>
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto overflow-hidden">
        <Sidebar/>
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
      {/* Global real-time overlay — listens for live video call notifications */}
      <LiveCallToast />
    </div>
  );
};

