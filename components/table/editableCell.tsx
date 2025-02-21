"use client";

import { memo, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { CellContext } from "@tanstack/react-table";
import { TableData } from "./DataTable";

interface EditableCellProps extends CellContext<TableData, any> {}

// Create a memoized cell component
export const EditableCell = memo(function EditableCell({ 
  getValue, 
  row, 
  column, 
  table 
}: EditableCellProps) {
  const initialValue = getValue();
  const [value, setValue] = useState(initialValue?.toString() ?? "");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setValue(initialValue?.toString() ?? "");
  }, [initialValue]);

  const onBlur = () => {
    setIsEditing(false);
    if (value !== initialValue?.toString()) {
      const finalValue = typeof initialValue === 'number' ? Number(value) : value;
      (table.options.meta as any)?.updateData(row.index, column.id, finalValue);
    }
  };

  return (
    <div className="relative size-full">
      {!isEditing ? (
        <div 
          className={cn(
            "absolute inset-0 px-4 truncate cursor-text",
            "hover:bg-muted/50"
          )}
          onClick={() => setIsEditing(true)}
        >
          {value}
        </div>
      ) : (
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={onBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              e.currentTarget.blur();
            }
            if (e.key === 'Escape') {
              setValue(initialValue?.toString() ?? "");
              setIsEditing(false);
            }
          }}
          autoFocus
          className={cn(
            "absolute inset-0",
            "w-full h-full bg-muted",
            "focus:outline-none focus:ring-0 border-0",
            "px-4"
          )}
        />
      )}
    </div>
  );
}, (prev, next) => {
  return (
    prev.getValue()?.toString() === next.getValue()?.toString() &&
    prev.row.index === next.row.index &&
    prev.column.id === next.column.id
  );
});
