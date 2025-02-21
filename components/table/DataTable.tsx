"use client";

import { useMemo, useCallback, useState } from "react";
import { useReactTable, getCoreRowModel, flexRender, ColumnDef, getSortedRowModel, Column } from "@tanstack/react-table";
import { Table, TableHead, TableRow, TableCell, TableBody, TableHeader } from "@/components/ui/table";
import { EditableCell } from "./editableCell";
import { AICell } from "./AICell";
import { ColumnHeader } from "./ColumnHeader";

import { cn } from "@/lib/utils";

export type TableData = Record<string, string | number | null>;

interface DataTableProps {
  data: TableData[];
  columns: ColumnDef<TableData, any>[];
  setData: (value: TableData[] | ((prev: TableData[]) => TableData[])) => void;
  setColumns: (value: ColumnDef<TableData, any>[] | ((prev: ColumnDef<TableData, any>[]) => ColumnDef<TableData, any>[])) => void;
  onCreateAIColumn: (name: string, prompt: string, position: "left" | "right", referenceColumnId: string) => void;
  onUpdateAIColumn: (columnId: string, prompt: string) => void;
}

export function DataTable({ 
  data, 
  columns, 
  setData, 
  setColumns,
  onCreateAIColumn,
  onUpdateAIColumn,
}: DataTableProps) {
  console.log('DataTable render');

  // Memoize the update functions
  const updateData = useCallback((rowIndex: number, columnId: string, value: string | number | null) => {
    setData(old => old.map((row, idx) => 
      idx === rowIndex ? { ...row, [columnId]: value } : row
    ));
  }, [setData]);

  const handleDeleteColumn = useCallback((columnId: string) => {
    setColumns(old => old.filter(col => 
      !('accessorKey' in col) || col.accessorKey !== columnId
    ));

    setData(old => old.map(row => {
      const newRow = { ...row };
      delete newRow[columnId];
      return newRow;
    }));
  }, [setColumns, setData]);

  const handleAddColumn = useCallback((position: "left" | "right", columnId: string, type: "regular" | "ai") => {
    const newColumnId = `col_${Date.now()}`;
    const newColumn: ColumnDef<TableData, any> = {
      accessorKey: newColumnId,
      header: "New Column",
      cell: EditableCell,
      meta: {
        type,
        prompt: type === 'ai' ? '' : undefined,
      },
    };

    setColumns(oldColumns => {
      const newColumns = [...oldColumns];
      const index = newColumns.findIndex(col => 
        'accessorKey' in col && col.accessorKey === columnId
      );
      const insertIndex = position === "right" ? index + 1 : index;
      newColumns.splice(insertIndex, 0, newColumn);
      return newColumns;
    });

    setData(oldData => oldData.map(row => ({
      ...row,
      [newColumnId]: null
    })));

    // If it's an AI column, trigger the config dialog
    if (type === 'ai') {
      // We need to pass this up to the parent to handle opening the config
      // This will be caught by the parent and used to open the config dialog
      const event = new CustomEvent('openAIConfig', { detail: { columnId: newColumnId } });
      window.dispatchEvent(event);
    }
  }, [setColumns, setData]);

  const handleCreateColumn = useCallback((name: string, type: "regular" | "ai") => {
    const newColumnId = `col_${Date.now()}`;
    const newColumn: ColumnDef<TableData, any> = {
      accessorKey: newColumnId,
      header: name,
      cell: EditableCell,
      meta: {
        type,
        prompt: type === 'ai' ? '' : undefined,
      },
    };

    setColumns(old => [...old, newColumn]);
    setData(old => old.map(row => ({
      ...row,
      [newColumnId]: null
    })));
  }, [setColumns, setData]);

  const handleUpdateAIColumn = useCallback(async (columnId: string, prompt: string) => {
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

    // Process all rows with the new prompt
    const promises = data.map(async (row, rowIndex) => {
      // Replace {{columnId}} references with actual values
      const resolvedPrompt = prompt.replace(/\{\{(.*?)\}\}/g, (_, colId) => {
        return row[colId]?.toString() || '';
      });

      try {
        const response = await fetch('/api/ai/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: resolvedPrompt })
        });
        
        const result = await response.json();
        
        // Update the cell value
        updateData(rowIndex, columnId, result.text);
      } catch (error) {
        console.error('Error processing AI prompt:', error);
        updateData(rowIndex, columnId, 'Error');
      }
    });

    // Wait for all rows to process
    await Promise.all(promises);
  }, [data, updateData, setColumns]);

  // First process the basic column properties
  const baseProcessedColumns = useMemo(() => {
    console.log('baseProcessedColumns recalculating');
    return columns.map(col => {
      if (!('accessorKey' in col)) return col;

      return {
        ...col,
        enableSorting: true,
        cell: (col.meta as any)?.type === 'ai' ? AICell : EditableCell,
        size: Math.max(200, (col.header?.toString()?.length ?? 0) * 12),
        minSize: 200,
      } as ColumnDef<TableData, any>;
    });
  }, [columns]);

  // Then add the header component using the base processed columns
  const processedColumns = useMemo(() => {
    console.log('processedColumns recalculating');
    return baseProcessedColumns.map(col => {
      if (!('accessorKey' in col)) return col;

      return {
        ...col,
        header: ({ column }: { column: Column<TableData, unknown> }) => (
          <ColumnHeader
            column={column}
            columns={baseProcessedColumns}
            title={typeof col.header === 'string' ? col.header : column.id}
            onDeleteColumn={handleDeleteColumn}
            onAddColumn={handleAddColumn}
            onUpdateAIColumn={onUpdateAIColumn}
            onCreateAIColumn={onCreateAIColumn}
          />
        ),
      } as ColumnDef<TableData, any>;
    });
  }, [baseProcessedColumns, handleDeleteColumn, handleAddColumn, onUpdateAIColumn, onCreateAIColumn]);

  // Create table instance
  const table = useReactTable<TableData>({
    data,
    columns: processedColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    meta: {
      updateData,
    },
    defaultColumn: {
      minSize: 100,
      maxSize: 400,
    },
  });

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 relative">
        <div className="absolute inset-0 overflow-auto">
          <div className="inline-block min-w-full">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10 shadow-[0_1px_2px_-1px_rgba(0,0,0,0.1)]">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead 
                        key={header.id}
                        style={{
                          width: header.getSize(),
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell 
                        key={cell.id} 
                        className="p-0 h-10"
                        style={{
                          width: cell.column.getSize(),
                        }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
