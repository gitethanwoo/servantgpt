"use client";

import * as React from "react";
import { memo, useMemo, useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ColumnDef } from "@tanstack/react-table";
import { TableData, AIColumnConfigProps, TableColumnDef } from "./types";
import { X, Check } from "lucide-react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Badge } from "@/components/ui/badge";

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
  const [searchTerm, setSearchTerm] = useState("");

  const filteredColumns = useMemo(() => {
    if (!searchTerm) return columns;
    return columns.filter(col => {
      const accessorKey = col.accessorKey?.toLowerCase() || '';
      const header = (typeof col.header === 'string' ? col.header : '').toLowerCase();
      const search = searchTerm.toLowerCase();
      return accessorKey.includes(search) || header.includes(search);
    });
  }, [columns, searchTerm]);

  const getColumnDisplayName = useCallback((col: TableColumnDef) => {
    if (typeof col.header === 'string') return col.header;
    return col.accessorKey || col.id || '';
  }, []);

  const handleSelectAll = useCallback(() => {
    const columnsToToggle = filteredColumns
      .map(col => col.accessorKey)
      .filter((key): key is string => typeof key === 'string');
    
    const allSelected = columnsToToggle.every(col => selectedColumns.has(col));
    
    columnsToToggle.forEach(col => {
      if (allSelected) {
        onToggleColumn(col);
      } else if (!selectedColumns.has(col)) {
        onToggleColumn(col);
      }
    });
  }, [filteredColumns, selectedColumns, onToggleColumn]);

  const allFilteredSelected = useMemo(() => {
    return filteredColumns
      .map(col => col.accessorKey)
      .filter((key): key is string => typeof key === 'string')
      .every(col => selectedColumns.has(col));
  }, [filteredColumns, selectedColumns]);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground pb-2">Referenced Columns</Label>
        {selectedColumns.size > 0 && (
          <Badge variant="outline" className="text-xs font-normal text-emerald-600">
            {selectedColumns.size} column{selectedColumns.size === 1 ? '' : 's'} selected
          </Badge>
        )}
      </div>
      <Command className="rounded-md border">
        <CommandInput 
          placeholder="Search columns..." 
          value={searchTerm}
          onValueChange={setSearchTerm}
        />
        <CommandList className="max-h-[200px]">
          <CommandEmpty>No columns found.</CommandEmpty>
          <CommandGroup className="bg-muted/50 px-1 py-0.5">
            <CommandItem
              onSelect={handleSelectAll}
              className="font-medium aria-selected:bg-primary/10"
            >
              <div className="flex items-center gap-2 w-full">
                <span className="w-4 shrink-0">
                  {allFilteredSelected && <Check className="size-4 text-emerald-600" />}
                </span>
                <span className="flex-1 truncate">
                  {allFilteredSelected ? 'Deselect All' : 'Select All'}
                </span>
              </div>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup>
            {filteredColumns.map((col) => {
              const columnId = col.accessorKey;
              if (!columnId) return null;
              
              const isSelected = selectedColumns.has(columnId);
              const displayName = getColumnDisplayName(col);
              
              return (
                <CommandItem
                  key={columnId}
                  value={columnId}
                  onSelect={() => onToggleColumn(columnId)}
                >
                  <div className="flex items-center gap-2 w-full">
                    <span className="w-4 shrink-0">
                      {isSelected && <Check className="size-4 text-emerald-600" />}
                    </span>
                    <span className="flex-1 truncate" title={displayName}>
                      {displayName}
                    </span>
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </Command>
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
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set());
  const [prompt, setPrompt] = useState("");
  
  // Initialize from initial value if it exists
  React.useEffect(() => {
    if (initialValue) {
      // Extract column references and text sections
      const regex = /{{([^}]+)}}/g;
      const columns = new Set<string>();
      let match;
      
      while ((match = regex.exec(initialValue)) !== null) {
        // Find the matching column by ID
        const columnId = match[1].trim();
        const column = availableColumns.find(col => col.accessorKey === columnId);
        if (column?.accessorKey) {
          columns.add(column.accessorKey);
        }
      }
      
      setSelectedColumns(columns);
      setPrompt(initialValue.replace(/{{[^}]+}}/g, '').trim());
    }
  }, [initialValue, availableColumns]);

  // Update the full prompt when text or columns change
  const updateFullPrompt = useCallback(() => {
    const parts = [prompt.trim()];
    
    // Add selected columns at the end
    if (selectedColumns.size > 0) {
      const validColumns = Array.from(selectedColumns)
        .filter(colId => availableColumns.some(col => col.accessorKey === colId))
        .map(colId => `{{${colId}}}`);
      
      if (validColumns.length > 0) {
        parts.push(validColumns.join(' '));
      }
    }
    
    onPromptChange(parts.filter(Boolean).join(' '));
  }, [prompt, selectedColumns, availableColumns, onPromptChange]);

  // Update when prompt or columns change
  useEffect(() => {
    updateFullPrompt();
  }, [prompt, selectedColumns, updateFullPrompt]);

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
      <TemplateSection
        label="Prompt"
        value={prompt}
        onChange={setPrompt}
        placeholder="Write your prompt here. Selected columns will be replaced with their values when processing..."
      />
      <ColumnReferenceSection
        columns={availableColumns}
        selectedColumns={selectedColumns}
        onToggleColumn={handleToggleColumn}
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
        onCreate(position, referenceColumnId, {
          type: "regular",
          name: name.trim(),
          prompt: prompt
        });
      }
    } else {
      if (onSave) {
        onSave({ prompt });
      }
    }
    onOpenChange(false);
  }, [name, isNewColumn, onCreate, position, referenceColumnId, prompt, onSave, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed right-0 top-0 z-50 flex h-full w-[480px] flex-col border-l bg-background shadow-lg">
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