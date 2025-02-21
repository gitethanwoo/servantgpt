"use client";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Column } from "@tanstack/react-table";
import { TableData } from "./DataTable";

interface ColumnHeaderMenuProps {
  column: Column<TableData, unknown>;
  onDeleteColumn: (columnId: string) => void;
}

export function ColumnHeaderMenu({ 
  column,
  onDeleteColumn
}: ColumnHeaderMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger className="size-full flex items-center px-4">
        {typeof column.columnDef.header === 'string' 
          ? column.columnDef.header 
          : column.id}
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem
          className="text-destructive"
          onClick={() => onDeleteColumn(column.id)}
        >
          Delete Column
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
} 