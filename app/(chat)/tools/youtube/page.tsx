'use client';

import { YoutubeTranscriptTool } from '@/components/youtube-transcript-tool';
import { ToolHeader } from '@/components/tool-header';

export default function YouTubeToolPage() {
  return (
    <>
      <ToolHeader selectedToolId="youtube" />
      <div className="p-6">
        <YoutubeTranscriptTool />
      </div>
    </>
  );
} 