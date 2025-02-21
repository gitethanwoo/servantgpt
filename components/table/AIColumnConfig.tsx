"use client";

import * as React from "react";
import { memo, useMemo, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ColumnDef } from "@tanstack/react-table";
import { TableData } from "./DataTable";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

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

// Memoized template section component
const TemplateSection = memo(function TemplateSection({
  value,
  onChange,
  placeholder,
  label
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Textarea
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[80px] resize-none"
      />
    </div>
  );
});

// Memoized column reference section
const ColumnReferenceSection = memo(function ColumnReferenceSection({
  columns,
  selectedColumns,
  onToggleColumn
}: {
  columns: TableColumnDef[];
  selectedColumns: Set<string>;
  onToggleColumn: (columnId: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">Referenced Columns</Label>
      <ScrollArea className="h-[200px] w-full rounded-md border bg-muted/5">
        <div className="p-2 grid grid-cols-1 gap-1.5">
          {columns.map((col) => {
            const columnId = col.accessorKey?.toString();
            if (!columnId) return null;
            
            const isSelected = selectedColumns.has(columnId);
            return (
              <Button
                key={columnId}
                variant={isSelected ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "h-auto min-h-[24px] py-1 px-2 text-xs justify-start font-normal whitespace-normal text-left",
                  isSelected && "bg-primary/20 hover:bg-primary/30"
                )}
                onClick={() => onToggleColumn(columnId)}
              >
                {columnId}
              </Button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
});

// Replace the existing PromptInput with this new version
const PromptInput = memo(function PromptInput({
  initialValue,
  onPromptChange,
  availableColumns
}: {
  initialValue: string;
  onPromptChange: (value: string) => void;
  availableColumns: TableColumnDef[];
}) {
  // Track selected columns and template sections
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set());
  const [prePrompt, setPrePrompt] = useState("");
  const [postPrompt, setPostPrompt] = useState("");
  
  // Initialize from initial value if it exists
  React.useEffect(() => {
    if (initialValue) {
      // Extract column references and text sections
      const regex = /{{([^}]+)}}/g;
      const columns = new Set<string>();
      let match;
      
      while ((match = regex.exec(initialValue)) !== null) {
        columns.add(match[1].trim());
      }
      
      setSelectedColumns(columns);
      
      // Split the text sections
      const parts = initialValue.split(/{{[^}]+}}/);
      setPrePrompt(parts[0]?.trim() || "");
      setPostPrompt(parts[1]?.trim() || "");
    }
  }, [initialValue]);

  // Update the full prompt when any section changes
  const updateFullPrompt = useCallback(() => {
    const columnRefs = Array.from(selectedColumns)
      .map(col => `{{${col}}}`)
      .join(" ");
    
    const parts = [
      prePrompt.trim(),
      columnRefs,
      postPrompt.trim()
    ].filter(Boolean);
    
    onPromptChange(parts.join(" "));
  }, [prePrompt, postPrompt, selectedColumns, onPromptChange]);

  // Update when any section changes
  React.useEffect(() => {
    updateFullPrompt();
  }, [prePrompt, postPrompt, selectedColumns, updateFullPrompt]);

  const handleToggleColumn = useCallback((columnId: string) => {
    setSelectedColumns(prev => {
      const next = new Set(prev);
      if (next.has(columnId)) {
        next.delete(columnId);
      } else {
        next.add(columnId);
      }
      return next;
    });
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium">AI Prompt Template</Label>
        <p className="text-sm text-muted-foreground mt-1">
          Build your prompt by combining text and column references
        </p>
      </div>
      
      <TemplateSection
        label="Before Columns"
        value={prePrompt}
        onChange={setPrePrompt}
        placeholder="Enter text that should appear before column references..."
      />
      
      <ColumnReferenceSection
        columns={availableColumns}
        selectedColumns={selectedColumns}
        onToggleColumn={handleToggleColumn}
      />
      
      <TemplateSection
        label="After Columns"
        value={postPrompt}
        onChange={setPostPrompt}
        placeholder="Enter text that should appear after column references..."
      />
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
          availableColumns={availableColumns}
        />
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