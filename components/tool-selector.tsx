import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { ChevronDownIcon } from './icons';
import { Mic, PlayIcon, Map, BarChart } from 'lucide-react';

export const tools = {
  audio: {
    id: 'audio',
    icon: <Mic className="size-4" />,
    label: 'Audio Transcription',
    description: 'Convert audio and video files to text'
  },
  youtube: {
    id: 'youtube',
    icon: <PlayIcon className="size-4" />,
    label: 'YouTube Transcript',
    description: 'Extract transcripts from YouTube videos'
  },
  sitemap: {
    id: 'sitemap',
    icon: <Map className="size-4" />,
    label: 'Visual Sitemap',
    description: 'Generate visual sitemaps for websites'
  },
  sentiment: {
    id: 'sentiment',
    icon: <BarChart className="size-4" />,
    label: 'Sentiment Analysis',
    description: 'Analyze emotional tone in conversations'
  }
} as const;

export type ToolId = keyof typeof tools;

export function ToolSelector({
  selectedToolId,
  onToolChange,
  className,
}: {
  selectedToolId: ToolId;
  onToolChange: (toolId: ToolId) => void;
} & React.ComponentProps<typeof Button>) {
  const [open, setOpen] = useState(false);
  const selectedTool = tools[selectedToolId];

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        asChild
        className={cn(
          'w-fit data-[state=open]:bg-accent data-[state=open]:text-accent-foreground',
          className,
        )}
      >
        <Button variant="outline" className="md:px-2 md:h-[34px]">
          {selectedTool.icon}
          {selectedTool.label}
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[280px] md:min-w-[300px]">
        {Object.values(tools).map((tool) => (
          <DropdownMenuItem
            key={tool.id}
            onSelect={() => {
              setOpen(false);
              onToolChange(tool.id as ToolId);
            }}
            className="gap-4 group/item flex flex-row justify-between items-center"
            data-active={tool.id === selectedToolId}
          >
            <div className="flex flex-row gap-2 items-center">
              {tool.icon}
              <div className="flex flex-col gap-1 items-start">
                {tool.label}
                {tool.description && (
                  <div className="text-xs text-muted-foreground">
                    {tool.description}
                  </div>
                )}
              </div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 