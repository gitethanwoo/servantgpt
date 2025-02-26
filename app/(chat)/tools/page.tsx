'use client';

import { useRouter } from 'next/navigation';
import { ToolHeader } from '@/components/tool-header';
import { tools, type ToolId } from '@/components/tool-selector';

export default function ToolsPage() {
  const router = useRouter();
  
  const navigateToTool = (toolId: ToolId) => {
    router.push(`/tools/${toolId}`);
  };

  return (
    <>
      <ToolHeader selectedToolId="audio" />
      <div className="p-6">
        <div className="flex flex-col items-center justify-center h-full">
          <h1 className="text-2xl font-bold mb-4">AI Tools</h1>
          <p className="text-muted-foreground mb-8">
            Choose a tool from the dropdown above to get started.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
            {Object.values(tools).map((tool) => (
              <div 
                key={tool.id} 
                className="border rounded-lg p-6 flex flex-col items-center text-center hover:border-primary transition-colors"
                onClick={() => navigateToTool(tool.id as ToolId)}
                style={{ cursor: 'pointer' }}
              >
                <div className="bg-muted rounded-full p-3 mb-4">
                  {tool.icon}
                </div>
                <h2 className="text-lg font-medium mb-2">{tool.label}</h2>
                <p className="text-sm text-muted-foreground">{tool.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
