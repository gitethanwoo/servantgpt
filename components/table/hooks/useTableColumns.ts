import { useState } from 'react';
import { TableData, TableColumnDef } from '../types';
import { EditableCellWrapper } from '../cellWrappers';

export interface UseTableColumnsProps {
  data?: TableData[];
  onColumnChange?: (columns: TableColumnDef[]) => void;
  onDataChange?: (data: TableData[]) => void;
}

export function useTableColumns({ 
  data = [], 
  onColumnChange, 
  onDataChange 
}: UseTableColumnsProps = {}) {
  const [columns, setColumns] = useState<TableColumnDef[]>([]);

  const updateColumns = (newColumns: TableColumnDef[]) => {
    const freshColumns = [...newColumns];
    setColumns(freshColumns);
    onColumnChange?.(freshColumns);
  };

  const addColumn = (position: "left" | "right", referenceColumnId?: string, options: {
    type?: "regular" | "ai";
    name?: string;
    prompt?: string;
  } = {}) => {
    const { type = "regular", name = "New Column", prompt } = options;
    
    const newColumnId = `col_${Date.now()}`;
    const newColumn: TableColumnDef = {
      accessorKey: newColumnId,
      header: name,
      cell: EditableCellWrapper,
      meta: {
        type,
        prompt,
        headerText: name,
      }
    };

    const newColumns = [...columns];
    const insertIndex = referenceColumnId 
      ? newColumns.findIndex(col => col.accessorKey === referenceColumnId) + (position === "right" ? 1 : 0)
      : position === "right" ? newColumns.length : 0;
    newColumns.splice(insertIndex, 0, newColumn);
    
    updateColumns(newColumns);
    return newColumnId;
  };

  const deleteColumn = (columnId: string) => {
    // Create new data array without the column
    const newData = data.map(row => {
      const { [columnId]: _, ...rest } = row;
      return rest;
    });

    // Create new columns array without the column
    const newColumns = columns.filter(col => col.accessorKey !== columnId);

    // Update both
    setColumns(newColumns);
    onColumnChange?.(newColumns);
    onDataChange?.(newData);

    return { newData, newColumns };
  };

  const updateColumnMeta = (columnId: string, meta: Partial<TableColumnDef['meta']>) => {
    setColumns(oldColumns => oldColumns.map(col => 
      col.accessorKey === columnId
        ? { 
            ...col, 
            meta: { 
              ...col.meta,
              ...meta
            }
          }
        : col
    ));
  };

  return {
    columns,
    setColumns: updateColumns,
    addColumn,
    deleteColumn,
    updateColumnMeta
  };
} 