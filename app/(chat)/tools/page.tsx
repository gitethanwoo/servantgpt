'use client';

import { useState, useCallback, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { UploadIcon, LoaderIcon, CopyIcon, UserIcon } from '@/components/icons';
import { toast } from "sonner"
import { SidebarToggle } from '@/components/sidebar-toggle';
import { upload } from '@vercel/blob/client';

export default function AudioTranscriptionTool() {

  const [transcription, setTranscription] = useState<{
    text: string;
    paragraphs: Array<{
      sentences: Array<{
        text: string;
        start: number;
        end: number;
        speaker: number;
      }>;
      speaker: number;
      num_words: number;
      start: number;
      end: number;
    }>;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [speakerNames, setSpeakerNames] = useState<Record<number, string>>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Get unique speakers from paragraphs
  const uniqueSpeakers = useMemo(() => {
    if (!transcription) return [];
    return Array.from(new Set(transcription.paragraphs.map(p => p.speaker))).sort();
  }, [transcription]);

  const handleSaveSpeakerNames = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const names: Record<number, string> = {};
    
    uniqueSpeakers.forEach(speaker => {
      const name = formData.get(`speaker-${speaker}`)?.toString();
      if (name) names[speaker] = name;
    });
    
    setSpeakerNames(names);
    setIsDialogOpen(false);
    toast.success("Speaker names updated");
  };

  const getSpeakerLabel = (speakerNumber: number) => {
    return speakerNames[speakerNumber] || `Speaker ${speakerNumber + 1}`;
  };

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
      setTranscription(data);
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

  const formatTimestamp = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = () => {
    if (!transcription) return;
    
    // Format the text with speaker names
    const formattedText = transcription.paragraphs.map(paragraph => {
      const speakerLabel = `${getSpeakerLabel(paragraph.speaker)}: `;
      const sentences = paragraph.sentences.map(s => s.text).join(' ');
      return `${speakerLabel}${sentences}`;
    }).join('\n\n');
    
    navigator.clipboard.writeText(formattedText);
    toast.success("Copied to clipboard");
  };

  const getSpeakerColor = (speakerNumber: number) => {
    const colors = [
      'bg-blue-500/20 text-blue-700 hover:bg-blue-500/20',
      'bg-green-500/20 text-green-700 hover:bg-green-500/20',
      'bg-purple-500/20 text-purple-700 hover:bg-purple-500/20',
      'bg-orange-500/20 text-orange-700 hover:bg-orange-500/20',
      'bg-pink-500/20 text-pink-700 hover:bg-pink-500/20'
    ];
    return colors[speakerNumber % colors.length];
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
                  <div className="flex items-center gap-4">
                    <h2 className="text-xl font-semibold">Transcription</h2>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <UserIcon />
                          Name Speakers
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Name Speakers</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSaveSpeakerNames} className="space-y-4 mt-4">
                          {uniqueSpeakers.map((speaker) => (
                            <div key={speaker} className="flex flex-col gap-2">
                              <label 
                                htmlFor={`speaker-${speaker}`}
                                className="text-sm font-medium"
                              >
                                Speaker {speaker + 1} Name
                              </label>
                              <Input
                                id={`speaker-${speaker}`}
                                name={`speaker-${speaker}`}
                                defaultValue={speakerNames[speaker] || ''}
                                placeholder={`Enter name for Speaker ${speaker + 1}`}
                              />
                            </div>
                          ))}
                          <Button type="submit" className="w-full">
                            Save Names
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
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
                <div className="p-4 bg-muted rounded-lg">
                  {transcription.paragraphs.map((paragraph, index) => (
                    <div key={index} className="mb-6">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge 
                          className={`${getSpeakerColor(paragraph.speaker)}`}
                        >
                          {getSpeakerLabel(paragraph.speaker)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatTimestamp(paragraph.start)}
                        </span>
                      </div>
                      <div className="whitespace-pre-wrap">
                        {paragraph.sentences.map((sentence, sIndex) => (
                          <span key={sIndex} className="mr-1">
                            {sentence.text}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
