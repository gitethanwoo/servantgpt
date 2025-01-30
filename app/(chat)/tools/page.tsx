'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { UploadIcon, LoaderIcon, CopyIcon } from '@/components/icons';
import { toast } from "sonner"
import { extractAudioFromVideo, splitAudioFile } from '@/lib/audio-utils';
import { SidebarToggle } from '@/components/sidebar-toggle';

export default function AudioTranscriptionTool() {
  const [transcription, setTranscription] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const processFile = async (file: File) => {
    console.log('Processing file:', file.type, file.size);
    // If it's a video, extract the audio first
    if (file.type.startsWith('video/')) {
      console.log('Extracting audio from video');
      const audioBlob = await extractAudioFromVideo(file);
      console.log('Audio extracted:', audioBlob.type, audioBlob.size);
      return audioBlob;
    }
    return file;
  };

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    try {
      setIsLoading(true);
      setError('');

      console.log('Starting file processing:', file.name, file.type);
      // First process video if needed
      const processedFile = await processFile(file);
      console.log('File processed:', processedFile.type, processedFile.size);
      
      // Then split into chunks if needed
      const chunks = await splitAudioFile(processedFile);
      console.log('File split into', chunks.length, 'chunks');
      
      let fullTranscript = '';
      
      for (const [index, chunk] of chunks.entries()) {
        toast.info(`Processing part ${index + 1} of ${chunks.length}`);
        console.log(`Uploading chunk ${index + 1}:`, chunk.type, chunk.size);
        
        // Upload chunk
        const uploadFormData = new FormData();
        uploadFormData.append('file', chunk);
        const uploadResponse = await fetch('/api/audio/upload', {
          method: 'POST',
          body: uploadFormData,
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          console.error('Upload failed:', errorData);
          throw new Error(`Failed to upload file: ${errorData.error || 'Unknown error'}`);
        }

        const { url } = await uploadResponse.json();
        console.log('Chunk uploaded successfully, URL:', url);
        
        // Transcribe chunk
        const transcribeResponse = await fetch('/api/transcribe', {
          method: 'POST',
          body: JSON.stringify({ audioUrl: url }),
          headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await transcribeResponse.json();
        fullTranscript += data.text + '\n';
      }

      setTranscription(fullTranscript);
      toast.success("Transcription complete");
    } catch (err) {
      console.error('Processing error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process audio');
    } finally {
      setIsLoading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.mp4', '.mpeg', '.mpga', '.m4a', '.wav', '.webm'],
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
          <h1 className="text-2xl font-bold mb-6 text-center">Audio / Video Transcription Tool</h1>
          
          <Card className="p-6">
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
                Supported formats: MP3, MP4, M4A, WAV, WEBM (max 25MB)
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
