"use client";

import { Column, ColumnDef } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown, Settings, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { TableData } from "./DataTable";
import { AIColumnConfig } from "./AIColumnConfig";
import { useState } from "react";

interface ColumnHeaderProps {
  column: Column<TableData, unknown>;
  title: string;
  onDeleteColumn: (columnId: string) => void;
  onAddColumn: (position: "left" | "right", columnId: string, type: "regular" | "ai") => void;
  onUpdateAIColumn: (columnId: string, prompt: string) => void;
  onCreateAIColumn: (name: string, prompt: string, position: "left" | "right", referenceColumnId: string) => void;
  columns: ColumnDef<TableData, any>[];
}

export function ColumnHeader({
  column,
  title,
  onDeleteColumn,
  onAddColumn,
  onUpdateAIColumn,
  onCreateAIColumn,
  columns,
}: ColumnHeaderProps) {
  const [configOpen, setConfigOpen] = useState(false);
  const [newColumnConfig, setNewColumnConfig] = useState<{ position: "left" | "right" } | null>(null);
  const isAIColumn = (column.columnDef.meta as any)?.type === 'ai';

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
          <ContextMenuItem onClick={() => {
            onAddColumn("left", column.id, "regular");
          }}>
            Insert Regular Column Left
          </ContextMenuItem>
          <ContextMenuItem onClick={() => {
            setNewColumnConfig({ position: "left" });
          }}>
            <Sparkles className="size-4 mr-2" />
            Insert AI Column Left
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => {
            onAddColumn("right", column.id, "regular");
          }}>
            Insert Regular Column Right
          </ContextMenuItem>
          <ContextMenuItem onClick={() => {
            setNewColumnConfig({ position: "right" });
          }}>
            <Sparkles className="size-4 mr-2" />
            Insert AI Column Right
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            className="text-destructive"
            onClick={() => onDeleteColumn(column.id)}
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
          currentColumnId={column.id}
          currentPrompt={(column.columnDef.meta as any)?.prompt}
          onSave={onUpdateAIColumn}
        />
      )}

      {/* Config panel for new AI column */}
      {newColumnConfig && (
        <AIColumnConfig
          open={true}
          onOpenChange={(open) => !open && setNewColumnConfig(null)}
          columns={columns}
          position={newColumnConfig.position}
          referenceColumnId={column.id}
          onCreate={onCreateAIColumn}
        />
      )}
    </div>
  );
} 