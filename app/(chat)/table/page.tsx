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

  const handleCreateAIColumn = (position: "left" | "right", referenceColumnId?: string, options = {}) => {
    const newColumnId = addColumn(position, referenceColumnId, options);
    return newColumnId;
  };

  const handleUpdateAIColumn = (columnId: string, options: { name?: string; prompt?: string }) => {
    updateColumnMeta(columnId, options);
  };

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
            handleUpdateAIColumn(configColumnId, options);
            setConfigOpen(false);
            setConfigColumnId(null);
          }}
        />
      )}
    </div>
  );
} 