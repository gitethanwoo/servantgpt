'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { UploadIcon, LoaderIcon, CopyIcon } from '@/components/icons';
import { toast } from "sonner"
import { SidebarToggle } from '@/components/sidebar-toggle';
import { upload } from '@vercel/blob/client';

export default function AudioTranscriptionTool() {

  const [transcription, setTranscription] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');


  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    try {
      setIsLoading(true);
      setError('');
      
      // Upload directly to blob storage from client
      const { url } = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/audio/upload',
      });
      
      // Send URL to transcribe endpoint
      const transcribeResponse = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ audioUrl: url }),
      });
      
      if (!transcribeResponse.ok) {
        throw new Error('Failed to transcribe file');
      }
      
      const data = await transcribeResponse.json();
      setTranscription(data.text);
      toast.success("Transcription complete");
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast.error("Failed to process file");
    } finally {
      setIsLoading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.m4a', '.wav', '.webm'],
      'video/*': ['.mp4', '.webm', '.mov'],
    },
    maxFiles: 1,
  });

  const copyToClipboard = () => {
    navigator.clipboard.writeText(transcription);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="relative flex flex-col flex-1 h-full">
      <div className="absolute left-2 top-1.5 z-10">
        <SidebarToggle />
      </div>
      
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <h1 className="text-2xl font-bold mb-2 text-center">Audio / Video Transcription Tool</h1>
          <p className="text-sm text-center text-muted-foreground mb-6">
            This tool transcribes audio and video files into text! 
          </p>
          
          <Card className="shadow-none border-none">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                ${isDragActive ? 'border-primary bg-primary/10' : 'border-gray-300 hover:border-primary'}
                flex flex-col items-center justify-center min-h-[200px]`}
            >
              <input {...getInputProps()} />
              <div className="mb-4">
                <UploadIcon size={24} />
              </div>
              <p className="text-lg mb-2">
                {isDragActive
                  ? 'Drop the audio file here'
                  : 'Drag and drop an audio file here, or click to select'}
              </p>
              <p className="text-sm text-gray-500">
                Supported formats: MP3, MP4, M4A, WAV, WEBM (max 100MB)
              </p>
            </div>

            {isLoading && (
              <div className="mt-8 flex flex-col items-center justify-center">
                <div className="animate-spin">
                  <LoaderIcon size={24} />
                </div>
                <p className="mt-2 text-sm text-gray-600">Transcribing your audio...</p>
              </div>
            )}

            {error && (
              <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-lg text-center">
                {error}
              </div>
            )}

            {transcription && (
              <div className="mt-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Transcription</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                    className="flex items-center gap-2"
                  >
                    <CopyIcon/>
                    Copy
                  </Button>
                </div>
                <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap">
                  {transcription}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
