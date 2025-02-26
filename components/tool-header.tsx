'use client';

import { useRouter } from 'next/navigation';
import { SidebarToggle } from '@/components/sidebar-toggle';
import { ToolSelector, type ToolId, tools } from '@/components/tool-selector';
import { useEffect } from 'react';

export function ToolHeader({ selectedToolId }: { selectedToolId: ToolId }) {
  const router = useRouter();

  // Update document title based on selected tool
  useEffect(() => {
    if (selectedToolId && tools[selectedToolId]) {
      document.title = `${tools[selectedToolId].label} | ServantGPT`;
    }
  }, [selectedToolId]);

  const handleToolChange = (toolId: ToolId) => {
    if (toolId !== selectedToolId) {
      // Navigate to the selected tool page
      router.push(`/tools/${toolId}`);
    }
  };

  return (
    <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2">
      <SidebarToggle />
      <ToolSelector 
        selectedToolId={selectedToolId}
        onToolChange={handleToolChange}
        className="order-1"
      />
    </header>
  );
} 