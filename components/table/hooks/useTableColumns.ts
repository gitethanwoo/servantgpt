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

  const updateColumnMeta = (columnId: string, meta: Partial<TableColumnDef['meta'] & { name?: string }>) => {
    console.log("[useTableColumns] updateColumnMeta called with:", { 
      columnId, 
      meta,
      metaPrompt: meta.prompt // Explicitly log the prompt
    });
    
    // Log the column before update
    const columnBefore = columns.find(col => col.accessorKey === columnId);
    console.log("[useTableColumns] Column before update:", columnBefore);
    
    const updatedColumns = columns.map(col => {
      if (col.accessorKey === columnId) {
        // Extract name if provided, to update the header
        const { name, ...restMeta } = meta;
        
        // Log what's in restMeta to see if prompt is there
        console.log("[useTableColumns] restMeta after extraction:", restMeta);
        
        // Create the updated column
        const updatedColumn = { 
          ...col,
          // Update header if name is provided
          ...(name ? { header: name } : {}),
          meta: { 
            ...col.meta,
            ...restMeta,
            // Also update headerText if name is provided
            ...(name ? { headerText: name } : {})
          }
        };
        
        console.log("[useTableColumns] Updated column:", updatedColumn);
        return updatedColumn;
      }
      return col;
    });
    
    // Update state and notify listeners
    setColumns(updatedColumns);
    onColumnChange?.(updatedColumns);
    
    // Log the columns after update
    console.log("[useTableColumns] Columns after update:", updatedColumns);
  };

  return {
    columns,
    setColumns: updateColumns,
    addColumn,
    deleteColumn,
    updateColumnMeta
  };
} 