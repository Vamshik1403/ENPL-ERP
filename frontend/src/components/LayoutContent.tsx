'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import { FormPanelProvider, useFormPanel } from './contexts/FormPanelContext';

function LayoutInner({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const prevCollapsed = useRef(false);
  const pathname = usePathname();
  const { isPanelOpen } = useFormPanel();

  // Auto-collapse sidebar when panel opens, restore when it closes
  useEffect(() => {
    if (isPanelOpen) {
      prevCollapsed.current = isCollapsed;
      setIsCollapsed(true);
    } else {
      setIsCollapsed(prevCollapsed.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPanelOpen]);

  // Hide sidebar on login page + tasks/view/*
  const shouldHideSidebar =
    pathname === '/login' ||
    pathname.startsWith('/tasks/view/');

  return (
    <div className="flex min-h-screen bg-white">
      {/* SIDEBAR (hidden on login & certain paths) */}
      {!shouldHideSidebar && (
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      )}

      {/* MAIN CONTENT */}
      <main
        className={`min-h-screen transition-all duration-300 ${
          shouldHideSidebar
            ? 'w-full ml-0'
            : isCollapsed
            ? 'ml-16 flex-1'
            : 'ml-56 flex-1'
        }`}
      >
        <div className="p-0">{children}</div>
      </main>
    </div>
  );
}

export default function LayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <FormPanelProvider>
      <LayoutInner>{children}</LayoutInner>
    </FormPanelProvider>
  );
}
