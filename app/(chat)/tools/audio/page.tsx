'use client';

import { AudioTranscriptionTool } from '@/components/audio-transcription-tool';
import { ToolHeader } from '@/components/tool-header';

export default function AudioToolPage() {
  return (
    <>
      <ToolHeader selectedToolId="audio" />
      <div className="p-6">
        <AudioTranscriptionTool />
      </div>
    </>
  );
} 