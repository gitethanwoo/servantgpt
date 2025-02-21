"use client";

import { useEffect, useState } from "react";
import { DataTable, TableData } from "@/components/table/DataTable";
import { useLocalStorage } from "@/components/table/useLocalStorage";
import { DataTableToolbar } from "@/components/table/DataTableToolbar";
import { ColumnDef } from "@tanstack/react-table";
import { EditableCell } from "@/components/table/editableCell";
import { AIColumnConfig } from "@/components/table/AIColumnConfig";

export default function TablePage() {
  const [data, setData] = useLocalStorage<TableData[]>("tableData", []);
  const [columns, setColumns] = useLocalStorage<ColumnDef<TableData, any>[]>("tableColumns", []);
  const [configOpen, setConfigOpen] = useState(false);
  const [configColumnId, setConfigColumnId] = useState<string | null>(null);

  const handleCSVUpload = (csvData: TableData[], newColumns: ColumnDef<TableData, any>[]) => {
    setData(csvData);
    setColumns(newColumns);
  };

  const handleAddColumn = (position: "left" | "right", referenceColumnId?: string, type: "regular" | "ai" = "regular") => {
    if (type === "ai") return; // AI columns are now handled by handleCreateAIColumn

    const newColumnId = `col_${Date.now()}`;
    const newColumn: ColumnDef<TableData, any> = {
      accessorKey: newColumnId,
      header: "New Column",
      cell: EditableCell,
    };

    setColumns(oldColumns => {
      const newColumns = [...oldColumns];
      const insertIndex = referenceColumnId 
        ? newColumns.findIndex(col => 'accessorKey' in col && col.accessorKey === referenceColumnId) + (position === "right" ? 1 : 0)
        : position === "right" ? newColumns.length : 0;
      newColumns.splice(insertIndex, 0, newColumn);
      return newColumns;
    });

    setData(oldData => oldData.map(row => ({
      ...row,
      [newColumnId]: null
    })));
  };

  const handleCreateAIColumn = (name: string, prompt: string, position: "left" | "right", referenceColumnId: string) => {
    const newColumnId = `col_${Date.now()}`;
    const newColumn: ColumnDef<TableData, any> = {
      accessorKey: newColumnId,
      header: name,
      cell: EditableCell,
      meta: {
        type: 'ai',
        prompt,
      },
    };

    setColumns(oldColumns => {
      const newColumns = [...oldColumns];
      const insertIndex = newColumns.findIndex(col => 
        'accessorKey' in col && col.accessorKey === referenceColumnId
      ) + (position === "right" ? 1 : 0);
      newColumns.splice(insertIndex, 0, newColumn);
      return newColumns;
    });

    // Add empty column
    setData(oldData => oldData.map(row => ({
      ...row,
      [newColumnId]: null
    })));
  };

  const handleUpdateAIColumn = async (columnId: string, prompt: string) => {
    // Update the column's prompt
    setColumns(old => old.map(col => 
      'accessorKey' in col && col.accessorKey === columnId
        ? { 
            ...col, 
            meta: { 
              ...col.meta, 
              prompt 
            }
          }
        : col
    ));
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
          data={data}
          columns={columns}
          onCSVUpload={handleCSVUpload}
          onAddColumn={handleAddColumn}
        />
      </div>
      <div className="flex-1 overflow-hidden">
        <DataTable 
          data={data} 
          columns={columns} 
          setData={setData} 
          setColumns={setColumns}
          onCreateAIColumn={handleCreateAIColumn}
          onUpdateAIColumn={handleUpdateAIColumn}
        />
      </div>
      {configColumnId && (
        <AIColumnConfig
          open={configOpen}
          onOpenChange={setConfigOpen}
          columns={columns}
          currentColumnId={configColumnId}
          currentPrompt={(columns.find(col => 
            'accessorKey' in col && col.accessorKey === configColumnId
          )?.meta as any)?.prompt || ''}
          onSave={(prompt) => {
            handleUpdateAIColumn(configColumnId, prompt);
            setConfigOpen(false);
            setConfigColumnId(null);
          }}
        />
      )}
    </div>
  );
} 