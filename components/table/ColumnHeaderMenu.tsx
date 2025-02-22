"use client";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Sparkles } from "lucide-react";
import { ColumnHeaderMenuProps, TableColumnDef } from "./types";

export function ColumnHeaderMenu({ 
  column,
  onDeleteColumn,
  onProcessColumn
}: ColumnHeaderMenuProps) {
  const columnDef = column.columnDef as TableColumnDef;
  const isAIColumn = columnDef.meta.type === 'ai';

  return (
    <ContextMenu>
      <ContextMenuTrigger className="size-full flex items-center px-4">
        {typeof columnDef.header === 'string' 
          ? columnDef.header 
          : columnDef.accessorKey}
      </ContextMenuTrigger>
      <ContextMenuContent>
        {isAIColumn && onProcessColumn && (
          <ContextMenuItem
            onClick={() => onProcessColumn(columnDef.accessorKey)}
            className="gap-2"
          >
            <Sparkles className="size-4" />
            Process Column
          </ContextMenuItem>
        )}
        <ContextMenuItem
          className="text-destructive"
          onClick={() => onDeleteColumn(columnDef.accessorKey)}
        >
          Delete Column
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
} 