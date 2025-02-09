'use client';

import { useState } from 'react';
import { YoutubeTranscriptTool } from '@/components/youtube-transcript-tool';
import { AudioTranscriptionTool } from '@/components/audio-transcription-tool';
import { SidebarToggle } from '@/components/sidebar-toggle';
import { ToolSelector, type ToolId } from '@/components/tool-selector';

export default function ToolsPage() {
  const [selectedTool, setSelectedTool] = useState<ToolId>('audio');

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2">
        <SidebarToggle />
        <ToolSelector 
          selectedToolId={selectedTool}
          onToolChange={setSelectedTool}
          className="order-1"
        />
      </header>

      <div className="container h-full overflow-y-auto p-6">
        {selectedTool === 'audio' && <AudioTranscriptionTool />}
        {selectedTool === 'youtube' && <YoutubeTranscriptTool />}
      </div>
    </div>
  );
}
