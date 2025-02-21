"use client";

import { memo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HeaderContext } from "@tanstack/react-table";
import { TableData } from "./DataTable";

interface EditableHeaderProps extends HeaderContext<TableData, any> {}

export const EditableHeader = memo(function EditableHeader({ column, table }: EditableHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState<string>(
    typeof column.columnDef.header === "string" 
      ? column.columnDef.header 
      : column.id
  );

  const onBlur = () => {
    if (value !== column.columnDef.header) {
      (table.options.meta as any)?.updateHeader(column.id, value);
    }
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={onBlur}
        onKeyDown={(e) => {
          if (e.key === "Enter") onBlur();
          if (e.key === "Escape") setIsEditing(false);
        }}
        className="h-8 w-full"
        autoFocus
      />
    );
  }

  return (
    <Button
      variant="ghost"
      className="h-8 w-full justify-start"
      onClick={() => setIsEditing(true)}
    >
      {value}
    </Button>
  );
}, (prev, next) => {
  return (
    prev.column.id === next.column.id &&
    prev.column.columnDef.header === next.column.columnDef.header
  );
});
