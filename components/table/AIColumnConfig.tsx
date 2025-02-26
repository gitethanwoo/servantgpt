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
  const [isInitialized, setIsInitialized] = useState(false);
  const previousPromptRef = useRef(initialValue);
  
  // Initialize from initial value if it exists - only run once or when initialValue actually changes
  React.useEffect(() => {
    // Skip if already initialized with this value
    if (initialValue === previousPromptRef.current && isInitialized) {
      return;
    }
    
    previousPromptRef.current = initialValue;
    
    if (initialValue) {
      // Extract column references and text sections
      const regex = /{{([^}]+)}}/g;
      const columns = new Set<string>();
      let match;
      let tempPrompt = initialValue;
      
      while ((match = regex.exec(initialValue)) !== null) {
        // Find the matching column by ID
        const columnId = match[1].trim();
        const column = availableColumns.find(col => col.accessorKey === columnId);
        if (column?.accessorKey) {
          columns.add(column.accessorKey);
        }
      }
      
      // Remove column references from prompt text
      tempPrompt = initialValue.replace(/{{[^}]+}}/g, '').trim();
      
      setSelectedColumns(columns);
      setPrompt(tempPrompt);
      setIsInitialized(true);
    }
  }, [initialValue, availableColumns, isInitialized]);

  // Memoize the full prompt calculation to avoid unnecessary updates
  const fullPrompt = useMemo(() => {
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
    
    return parts.filter(Boolean).join(' ');
  }, [prompt, selectedColumns, availableColumns]);

  // Only update when the calculated full prompt actually changes
  useEffect(() => {
    // Skip the initial automatic trigger
    if (!isInitialized) return;
    
    // Only call onPromptChange if the prompt has actually changed
    if (fullPrompt !== previousPromptRef.current) {
      previousPromptRef.current = fullPrompt;
      onPromptChange(fullPrompt);
    }
  }, [fullPrompt, onPromptChange, isInitialized]);

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
  // Get the current column to access its properties
  const currentColumn = useMemo(() => 
    currentColumnId ? columns.find(col => col.accessorKey === currentColumnId) : undefined,
    [columns, currentColumnId]
  );
  
  // Initialize state from the current column
  const [name, setName] = React.useState(
    currentColumn?.header?.toString() || 
    currentColumn?.meta?.headerText || 
    ""
  );
  const [prompt, setPrompt] = React.useState(currentPrompt);
  const isNewColumn = !currentColumnId;
  const initializedRef = useRef(false);

  // Memoize available columns calculation
  const availableColumns = useMemo(() => 
    columns.filter((col): col is TableColumnDef & { accessorKey: string } => {
      if (!col.accessorKey) return false;
      return isNewColumn || col.accessorKey !== currentColumnId;
    }),
    [columns, currentColumnId, isNewColumn]
  );

  // Reset state when panel opens or relevant props change
  React.useEffect(() => {
    if (open && !initializedRef.current) {
      setPrompt(currentPrompt);
      setName(
        currentColumn?.header?.toString() || 
        currentColumn?.meta?.headerText || 
        ""
      );
      initializedRef.current = true;
    } else if (!open) {
      // Reset the initialized flag when closed
      initializedRef.current = false;
    }
  }, [open, currentPrompt, currentColumn]);

  // Memoize the save handler
  const handleSave = React.useCallback(() => {
    if (!name.trim()) return;

    if (isNewColumn) {
      if (onCreate && position && referenceColumnId) {
        console.log("[AIColumnConfig] Creating new column with:", { 
          position, 
          referenceColumnId, 
          name: name.trim(), 
          prompt 
        });
        onCreate(position, referenceColumnId, {
          type: "ai",
          name: name.trim(),
          prompt: prompt
        });
      }
    } else {
      if (onSave) {
        // For existing columns, include both name and prompt
        console.log("[AIColumnConfig] Saving existing column with:", { 
          name: name.trim(), 
          prompt 
        });
        onSave({ 
          name: name.trim(),
          prompt 
        });
        console.log("[AIColumnConfig] Save called");
      }
    }
    onOpenChange(false);
  }, [name, isNewColumn, onCreate, position, referenceColumnId, prompt, onSave, onOpenChange]);

  // If not open, don't render anything
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
        {/* Allow editing name for both new and existing columns */}
        <NameInput
          initialValue={name}
          onNameChange={setName}
        />
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