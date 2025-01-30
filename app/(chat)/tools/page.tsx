'use client';

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { UploadIcon, LoaderIcon, CopyIcon } from '@/components/icons';
import { toast } from "sonner"

export default function AudioTranscriptionTool() {
  const [transcription, setTranscription] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Check file size (25MB limit)
    if (file.size > 25 * 1024 * 1024) {
      setError('File size must be less than 25MB');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('model', 'whisper-large-v3-turbo');

      // Call Groq API
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const data = await response.json();
      setTranscription(data.text);
      toast.success("Transcription complete");
    } catch (err) {
      setError('Failed to transcribe audio. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.mp4', '.mpeg', '.mpga', '.m4a', '.wav', '.webm'],
    },
    maxFiles: 1,
  });

  const copyToClipboard = () => {
    navigator.clipboard.writeText(transcription);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Audio Transcription Tool</h1>
      
      <Card className="p-6">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-primary bg-primary/10' : 'border-gray-300 hover:border-primary'}`}
        >
          <input {...getInputProps()} />
          <UploadIcon size={48} />
          <p className="text-lg">
            {isDragActive
              ? 'Drop the audio file here'
              : 'Drag and drop an audio file here, or click to select'}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Supported formats: MP3, MP4, M4A, WAV, WEBM (max 25MB)
          </p>
        </div>

        {isLoading && (
          <div className="mt-4 text-center">
            <LoaderIcon size={24} />
            <p className="mt-2">Transcribing your audio...</p>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg">
            {error}
          </div>
        )}

        {transcription && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-semibold">Transcription</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="flex items-center gap-2"
              >
                <CopyIcon size={16} />
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
  );
}
