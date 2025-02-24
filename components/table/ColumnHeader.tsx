"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown, Settings, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { AIColumnConfig } from "./AIColumnConfig";
import { Column } from "@tanstack/react-table";
import { TableData, TableColumnDef } from "./types";

interface ColumnHeaderProps {
  column: Column<TableData, unknown>;
  columns: TableColumnDef[];
  title: string;
  onDelete: () => void;
  onCreateAI: (position: "left" | "right") => void;
  onUpdateAI: (options: { prompt?: string }) => void;
}

export function ColumnHeader({
  column,
  columns,
  title,
  onDelete,
  onCreateAI,
  onUpdateAI
}: ColumnHeaderProps) {
  const [configOpen, setConfigOpen] = useState(false);
  const [newColumnConfig, setNewColumnConfig] = useState<{ position: "left" | "right" } | null>(null);
  const columnDef = column.columnDef as TableColumnDef;
  const isAIColumn = columnDef.meta?.type === 'ai';

  return (
    <div className="flex items-center space-x-2 w-full">
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-full justify-between"
            onClick={() => column.toggleSorting()}
          >
            <span className="flex items-center gap-2">
              {isAIColumn && <Settings className="size-4" />}
              {title}
            </span>
            {column.getIsSorted() === "desc" ? (
              <ArrowDown className="size-4" />
            ) : column.getIsSorted() === "asc" ? (
              <ArrowUp className="size-4" />
            ) : (
              <ChevronsUpDown className="size-4" />
            )}
          </Button>
        </ContextMenuTrigger>
        <ContextMenuContent>
          {isAIColumn && (
            <>
              <ContextMenuItem onClick={() => setConfigOpen(true)}>
                Configure AI
              </ContextMenuItem>
              <ContextMenuSeparator />
            </>
          )}
          <ContextMenuItem onClick={() => onCreateAI("left")}>
            <Sparkles className="size-4 mr-2" />
            Insert AI Column Left
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onCreateAI("right")}>
            <Sparkles className="size-4 mr-2" />
            Insert AI Column Right
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            className="text-destructive"
            onClick={onDelete}
          >
            Delete Column
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* Config panel for existing AI column */}
      {isAIColumn && (
        <AIColumnConfig
          open={configOpen}
          onOpenChange={setConfigOpen}
          columns={columns}
          currentColumnId={columnDef.accessorKey}
          currentPrompt={columnDef.meta.prompt}
          onSave={(options: { prompt?: string }) => onUpdateAI(options)}
        />
      )}

      {/* Config panel for new AI column */}
      {newColumnConfig && (
        <AIColumnConfig
          open={true}
          onOpenChange={(open) => !open && setNewColumnConfig(null)}
          columns={columns}
          position={newColumnConfig.position}
          referenceColumnId={columnDef.accessorKey}
          onCreate={onCreateAI}
        />
      )}
    </div>
  );
} 