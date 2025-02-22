"use client";

import { memo, useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { CellContext, Table } from "@tanstack/react-table";
import { TableData, TableMeta } from "./types";

interface EditableCellProps extends CellContext<TableData, any> {
  table: Table<TableData> & {
    options: {
      meta?: TableMeta;
    };
  };
}

// Create a memoized cell component
export const EditableCell = memo(function EditableCell({ 
  getValue, 
  row, 
  column, 
  table 
}: EditableCellProps) {
  const initialValue = getValue();
  const [value, setValue] = useState(initialValue?.toString() ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  // Optimize update to only affect this cell
  const updateValue = useCallback((newValue: string) => {
    if (newValue === initialValue?.toString()) return;
    const finalValue = typeof initialValue === 'number' ? Number(newValue) : newValue;
    
    // Just notify the table - it will handle the update
    table.options.meta?.updateData(row.index, column.id, finalValue);
  }, [initialValue, row.index, column.id, table.options.meta]);

  return (
    <div className="relative size-full group">
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => updateValue(value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            e.currentTarget.blur();
          }
          if (e.key === 'Escape') {
            setValue(initialValue?.toString() ?? "");
            e.currentTarget.blur();
          }
        }}
        className={cn(
          "absolute inset-0 w-full h-full px-4",
          "focus:bg-muted focus:outline-none focus:ring-0 border-0",
          "cursor-text",
          "not-focus:bg-transparent",
          "transform-gpu",
          "will-change-transform"
        )}
        style={{
          contain: 'strict',
        }}
      />
    </div>
  );
}, (prev, next) => {
  return (
    prev.getValue()?.toString() === next.getValue()?.toString() &&
    prev.row.index === next.row.index &&
    prev.column.id === next.column.id
  );
});
