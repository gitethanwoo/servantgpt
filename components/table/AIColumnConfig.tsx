"use client";

import * as React from "react";
import { memo, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ColumnDef } from "@tanstack/react-table";
import { TableData } from "./DataTable";
import { X } from "lucide-react";

// Define a more specific type for our column definition
type TableColumnDef = ColumnDef<TableData, any> & {
  accessorKey?: string;
  meta?: {
    type?: 'regular' | 'ai';
    prompt?: string;
  };
};

// Memoized column chip component
const ColumnChip = memo(function ColumnChip({
  columnId,
  onDelete
}: {
  columnId: string;
  onDelete: () => void;
}) {
  return (
    <span 
      className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-500 rounded-md px-1.5 py-0.5 text-sm font-medium group mx-0.5 hover:bg-blue-500/20 transition-colors cursor-default"
    >
      <span className="pointer-events-none">{columnId}</span>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDelete();
        }}
        className="opacity-50 hover:opacity-100 focus:opacity-100 cursor-pointer"
      >
        <X className="size-3" />
      </button>
    </span>
  );
});

interface AIColumnConfigProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: TableColumnDef[];
  // Make these optional since we might be creating a new column
  currentColumnId?: string;
  currentPrompt?: string;
  position?: "left" | "right";
  referenceColumnId?: string;
  // Separate handlers for create vs update
  onSave?: (columnId: string, prompt: string) => void;
  onCreate?: (name: string, prompt: string, position: "left" | "right", referenceColumnId: string) => void;
}

// Memoized column button component
const ColumnButton = memo(function ColumnButton({
  columnId,
  label,
  onClick
}: {
  columnId: string;
  label: string;
  onClick: (columnId: string) => void;
}) {
  return (
    <Button
      variant="ghost"
      className="w-full justify-start font-normal rounded-sm h-9 px-3 hover:bg-accent text-left truncate"
      onClick={() => onClick(columnId)}
    >
      {label}
    </Button>
  );
});

// Memoized available columns section
const AvailableColumns = memo(function AvailableColumns({
  availableColumns,
  onColumnClick
}: {
  availableColumns: TableColumnDef[];
  onColumnClick: (columnId: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Available Columns</Label>
        <span className="text-xs text-muted-foreground">Click to reference</span>
      </div>
      <div className="relative">
        <ScrollArea className="h-[200px] w-full rounded-md border bg-muted/5">
          <div className="p-2 flex flex-col gap-1">
            {availableColumns.map((col) => {
              const columnId = col.accessorKey?.toString();
              if (!columnId) return null;
              
              const label = col.header?.toString() || columnId;
              return (
                <ColumnButton
                  key={columnId}
                  columnId={columnId}
                  label={label}
                  onClick={onColumnClick}
                />
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
});

// Memoized name input component
const NameInput = memo(function NameInput({
  initialValue,
  onNameChange
}: {
  initialValue: string;
  onNameChange: (value: string) => void;
}) {
  const [localName, setLocalName] = React.useState(initialValue);

  React.useEffect(() => {
    setLocalName(initialValue);
  }, [initialValue]);

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Column Name</Label>
      <Input
        placeholder="Enter column name"
        value={localName}
        onChange={(e) => setLocalName(e.target.value)}
        onBlur={() => onNameChange(localName)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onNameChange(localName);
          }
        }}
      />
    </div>
  );
});

// Memoized prompt input component
const PromptInput = memo(function PromptInput({
  initialValue,
  onPromptChange,
  children
}: {
  initialValue: string;
  onPromptChange: (value: string) => void;
  children?: React.ReactNode;
}) {
  const [localPrompt, setLocalPrompt] = React.useState(initialValue);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    setLocalPrompt(initialValue);
  }, [initialValue]);

  // Parse the prompt to find column references
  const segments = React.useMemo(() => {
    const regex = /{{([^}]+)}}/g;
    const parts: { type: 'text' | 'column'; content: string }[] = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(localPrompt)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: localPrompt.slice(lastIndex, match.index)
        });
      }
      // Add the column reference
      parts.push({
        type: 'column',
        content: match[1].trim()
      });
      lastIndex = regex.lastIndex;
    }
    // Add remaining text
    if (lastIndex < localPrompt.length) {
      parts.push({
        type: 'text',
        content: localPrompt.slice(lastIndex)
      });
    }
    return parts;
  }, [localPrompt]);

  const handleDelete = React.useCallback((index: number) => {
    const newSegments = [...segments];
    const deletedSegment = newSegments[index];
    
    if (deletedSegment.type === 'column') {
      // Simply filter out the segment and join the rest
      const updatedPrompt = segments
        .filter((_, i) => i !== index)
        .map(s => s.type === 'column' ? `{{${s.content}}}` : s.content)
        .join('')
        .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
        .trim();
      
      setLocalPrompt(updatedPrompt);
      onPromptChange(updatedPrompt);
    }
  }, [segments, onPromptChange]);

  return (
    <div className="space-y-4">
      {children}
      <div className="space-y-2">
        <Label className="text-sm font-medium">AI Prompt</Label>
        <div className="relative min-h-[150px] rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
          <Textarea
            ref={textareaRef}
            placeholder="Enter your prompt... Click column names above to reference them"
            value={localPrompt}
            onChange={(e) => {
              setLocalPrompt(e.target.value);
              onPromptChange(e.target.value);
            }}
            className="absolute inset-0 opacity-0 pointer-events-none"
          />
          <div className="relative whitespace-pre-wrap break-words flex flex-wrap gap-y-1 [&>span]:leading-relaxed">
            {segments.map((segment, index) => (
              segment.type === 'column' ? (
                <ColumnChip
                  key={index}
                  columnId={segment.content}
                  onDelete={() => handleDelete(index)}
                />
              ) : (
                <span key={index} className="inline-block pointer-events-none">{segment.content}</span>
              )
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

export function AIColumnConfig({
  open,
  onOpenChange,
  columns,
  currentColumnId,
  currentPrompt = "",
  position,
  referenceColumnId,
  onSave,
  onCreate,
}: AIColumnConfigProps) {
  const [name, setName] = React.useState(currentColumnId ? 
    columns.find(col => col.accessorKey === currentColumnId)?.header?.toString() || "" 
    : "");
  const [prompt, setPrompt] = React.useState(currentPrompt);
  const isNewColumn = !currentColumnId;

  // Memoize available columns calculation
  const availableColumns = useMemo(() => 
    columns.filter((col): col is TableColumnDef & { accessorKey: string } => {
      if (!col.accessorKey) return false;
      return isNewColumn || col.accessorKey !== currentColumnId;
    }),
    [columns, currentColumnId, isNewColumn]
  );

  // Reset state when panel opens
  React.useEffect(() => {
    if (open) {
      setPrompt(currentPrompt);
      setName(currentColumnId ? 
        columns.find(col => col.accessorKey === currentColumnId)?.header?.toString() || "" 
        : "");
    }
  }, [open, currentPrompt, currentColumnId, columns]);

  const handleSave = React.useCallback(() => {
    if (!name.trim()) return;

    if (isNewColumn) {
      if (onCreate && position && referenceColumnId) {
        onCreate(name.trim(), prompt, position, referenceColumnId);
      }
    } else {
      if (onSave && currentColumnId) {
        onSave(currentColumnId, prompt);
      }
    }
    onOpenChange(false);
  }, [name, isNewColumn, onCreate, position, referenceColumnId, prompt, onSave, currentColumnId, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed right-0 top-0 z-50 flex h-full w-[400px] flex-col border-l bg-background shadow-lg">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <h3 className="font-semibold">{isNewColumn ? "Create AI Column" : "Configure AI Column"}</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onOpenChange(false)}
        >
          <X className="size-4" />
        </Button>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <div>
          <p className="text-sm text-muted-foreground whitespace-normal">
            Set up how this column should process data using AI. Reference other columns using the buttons below.
          </p>
        </div>
        {isNewColumn && (
          <NameInput
            initialValue={name}
            onNameChange={setName}
          />
        )}
        <PromptInput
          initialValue={prompt}
          onPromptChange={setPrompt}
        >
          <AvailableColumns 
            availableColumns={availableColumns}
            onColumnClick={(columnId) => {
              setPrompt(prev => prev + ` {{${columnId}}}`);
            }}
          />
        </PromptInput>
      </div>
      <div className="border-t p-4">
        <Button 
          onClick={handleSave}
          className="w-full"
          disabled={!name.trim()}
        >
          {isNewColumn ? "Create Column" : "Save Changes"}
        </Button>
      </div>
    </div>
  );
} 