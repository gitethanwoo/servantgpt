"use client";

import * as React from "react";
import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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

// Memoized column reference section - kept because it contains complex logic
const ColumnReferenceSection = React.memo(function ColumnReferenceSection({
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
  
  // Initialize state directly in the main component
  const [name, setName] = useState(
    currentColumn?.header?.toString() || 
    currentColumn?.meta?.headerText || 
    ""
  );
  const [prompt, setPrompt] = useState("");
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set());
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
  useEffect(() => {
    if (open && !initializedRef.current) {
      // Initialize from current prompt if it exists
      if (currentPrompt) {
        // Extract column references and text sections
        const regex = /{{([^}]+)}}/g;
        const columnsSet = new Set<string>();
        let match;
        let textPrompt = currentPrompt;
        
        while ((match = regex.exec(currentPrompt)) !== null) {
          // Find the matching column by ID
          const columnId = match[1].trim();
          const column = availableColumns.find(col => col.accessorKey === columnId);
          if (column?.accessorKey) {
            columnsSet.add(column.accessorKey);
          }
        }
        
        // Remove column references from prompt text
        textPrompt = currentPrompt.replace(/{{[^}]+}}/g, '').trim();
        
        setSelectedColumns(columnsSet);
        setPrompt(textPrompt);
      } else {
        setPrompt("");
        setSelectedColumns(new Set());
      }
      
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
  }, [open, currentPrompt, currentColumn, availableColumns]);

  // Calculate the full prompt with column references
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

  // Memoize the save handler
  const handleSave = useCallback(() => {
    if (!name.trim()) return;

    if (isNewColumn) {
      if (onCreate && position && referenceColumnId) {
        console.log("[AIColumnConfig] Creating new column with:", { 
          position, 
          referenceColumnId, 
          name: name.trim(), 
          prompt: fullPrompt 
        });
        onCreate(position, referenceColumnId, {
          type: "ai",
          name: name.trim(),
          prompt: fullPrompt
        });
      }
    } else {
      if (onSave) {
        // For existing columns, include both name and prompt
        console.log("[AIColumnConfig] Saving existing column with:", { 
          name: name.trim(), 
          prompt: fullPrompt 
        });
        onSave({ 
          name: name.trim(),
          prompt: fullPrompt 
        });
        console.log("[AIColumnConfig] Save called");
      }
    }
    onOpenChange(false);
  }, [name, isNewColumn, onCreate, position, referenceColumnId, fullPrompt, onSave, onOpenChange]);

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
        
        {/* Name input directly in the component */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Column Name</Label>
          <Input
            placeholder="Enter column name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        
        {/* Prompt input directly in the component */}
        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Prompt</Label>
            <Textarea
              placeholder="Write your prompt here. Selected columns will be replaced with their values when processing..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>
          
          {/* Keep the column reference section as it contains complex logic */}
          <ColumnReferenceSection
            columns={availableColumns}
            selectedColumns={selectedColumns}
            onToggleColumn={handleToggleColumn}
          />
        </div>
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