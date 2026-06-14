import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex flex-col flex-1 w-full min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1400px] mx-auto px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
