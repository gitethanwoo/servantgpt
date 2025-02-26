"use client";

import { useState, useEffect, useCallback } from 'react';
import { DataTable } from "@/components/table/DataTable";
import { DataTableToolbar } from "@/components/table/DataTableToolbar";
import { AIColumnConfig } from "@/components/table/AIColumnConfig";
import { TableData, TableColumnDef } from "@/components/table/types";
import { useTableColumns } from "@/components/table/hooks/useTableColumns";
import { useTableData } from "@/components/table/hooks/useTableData";

export default function TablePage() {
  const [data, setData] = useState<TableData[]>([]);

  const handleUpdateCell = useCallback((rowIndex: number, columnId: string, value: any) => {
    setData(old => old.map((row, index) => 
      index === rowIndex 
        ? { ...row, [columnId]: value }
        : row
    ));
  }, []);

  const {
    columns,
    setColumns,
    addColumn,
    deleteColumn,
    updateColumnMeta
  } = useTableColumns({
    data,
    onDataChange: setData
  });

  const [configOpen, setConfigOpen] = useState(false);
  const [configColumnId, setConfigColumnId] = useState<string | null>(null);

  const handleCSVUpload = (csvData: TableData[], newColumns: TableColumnDef[]) => {
    console.log('CSV Upload - Received data:', csvData.length, 'rows');
    console.log('CSV Upload - Received columns:', newColumns);
    setData(csvData);
    setColumns(newColumns);
  };

  const handleDeleteColumn = (columnId: string) => {
    const { newData, newColumns } = deleteColumn(columnId);
    setData(newData);
    setColumns(newColumns);
  };

  const handleCreateAIColumn = useCallback((position: "left" | "right", referenceColumnId?: string, options: {
    type?: "regular" | "ai";
    name?: string;
    prompt?: string;
  } = {}) => {
    // Always ensure type is AI
    const newColumnId = addColumn(position, referenceColumnId, { 
      ...options, 
      type: "ai",
      name: options.name || "AI Column" 
    });
    
    // Open the configuration panel for the new column
    setConfigColumnId(newColumnId);
    setConfigOpen(true);
    
    return newColumnId;
  }, [addColumn]);

  const handleUpdateAIColumn = useCallback((columnId: string, options: { name?: string; prompt?: string }) => {
    console.log("[TablePage] handleUpdateAIColumn called with:", { columnId, options });
    updateColumnMeta(columnId, {
      ...options,
      type: "ai" // Ensure type stays AI
    });
    
    // Check if update was successful
    setTimeout(() => {
      const updatedColumn = columns.find(col => col.accessorKey === columnId);
      console.log("[TablePage] Column after update:", updatedColumn);
    }, 0);
  }, [updateColumnMeta, columns]);

  // Listen for AI config events
  useEffect(() => {
    const handleAIConfig = (event: CustomEvent<{ columnId: string }>) => {
      setConfigColumnId(event.detail.columnId);
      setConfigOpen(true);
    };

    window.addEventListener('openAIConfig' as any, handleAIConfig);
    return () => window.removeEventListener('openAIConfig' as any, handleAIConfig);
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="px-10 py-6 flex-none bg-background border-b">
        <h1 className="text-2xl font-bold mb-5">CSV Table Viewer</h1>
        <DataTableToolbar 
          onCSVUpload={handleCSVUpload}
        />
      </div>
      <div className="flex-1 overflow-hidden">
        <DataTable 
          data={data} 
          columns={columns}
          onUpdateCell={handleUpdateCell}
          onCreateAIColumn={handleCreateAIColumn}
          onUpdateAIColumn={handleUpdateAIColumn}
          onDeleteColumn={handleDeleteColumn}
        />
      </div>
      {configColumnId && (
        <AIColumnConfig
          open={configOpen}
          onOpenChange={setConfigOpen}
          columns={columns}
          currentColumnId={configColumnId}
          currentPrompt={(columns.find(col => 
            col.accessorKey === configColumnId
          )?.meta?.prompt) || ''}
          onSave={(options) => {
            console.log("[TablePage] AIColumnConfig onSave received:", options);
            handleUpdateAIColumn(configColumnId, options);
            setConfigOpen(false);
            setConfigColumnId(null);
          }}
        />
      )}
    </div>
  );
} 