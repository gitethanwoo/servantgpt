import { memo, useState, useCallback, useEffect } from "react";
import { useCompletion } from "ai/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { CellProps, ColumnMeta } from "./types";

export const AICell = memo(function AICell({ 
  getValue, 
  row, 
  column, 
  table 
}: CellProps) {
  const [value, setValue] = useState(getValue()?.toString() ?? "");
  const [isEditing, setIsEditing] = useState(false);

  // Log column definition on mount
  useEffect(() => {
    console.log("[AICell] Mounted with column:", { 
      accessorKey: column.columnDef.accessorKey,
      meta: column.columnDef.meta
    });
  }, [column.columnDef]);

  const { complete, isLoading } = useCompletion({
    api: '/api/tools/table-ai',
    onFinish: (_, completion) => {
      if (completion && table.options.meta?.updateData) {
        setValue(completion);
        table.options.meta.updateData(row.index, column.columnDef.accessorKey, completion);
      }
    },
    onError: (error) => {
      console.error('Error processing AI prompt:', error);
      setValue('Error');
      if (table.options.meta?.updateData) {
        table.options.meta.updateData(row.index, column.columnDef.accessorKey, 'Error');
      }
    }
  });

  const processCell = useCallback(async () => {
    const prompt = column.columnDef.meta?.prompt;
    console.log("[AICell] processCell accessing prompt:", { 
      accessorKey: column.columnDef.accessorKey,
      prompt,
      meta: column.columnDef.meta
    });
    
    if (!prompt) return;

    // Resolve column references in the prompt
    const resolvedPrompt = prompt.replace(/\{\{([^}]+)\}\}/g, (_, columnId) => {
      const cleanColumnId = columnId.trim();
      const targetColumn = table.getColumn(cleanColumnId);
      if (!targetColumn) return columnId;

      const rawValue = row.getValue(cleanColumnId);
      const value = typeof rawValue === 'object' ? JSON.stringify(rawValue) : rawValue;
      const header = (targetColumn.columnDef.meta as ColumnMeta)?.headerText ?? cleanColumnId;
      
      return `${header}: "${value}"`;
    });

    console.log("[AICell] Sending resolved prompt:", resolvedPrompt);
    await complete(resolvedPrompt);
  }, [column.columnDef.meta?.prompt, complete, row, table]);

  // Watch for column process triggers
  const columnProcessTrigger = table.options.meta?.columnProcessTrigger;
  if (columnProcessTrigger?.columnId === column.columnDef.accessorKey && !isLoading) {
    processCell();
  }

  const onBlur = () => {
    setIsEditing(false);
    const initialValue = getValue();
    if (value !== initialValue?.toString() && table.options.meta?.updateData) {
      const newValue = typeof initialValue === 'number' ? Number(value) : value;
      table.options.meta.updateData(row.index, column.columnDef.accessorKey, newValue);
    }
  };

  return (
    <div className="relative size-full group">
      {!isEditing && (
        <div className="absolute inset-0 flex items-center">
          <div 
            className={cn(
              "flex-1 px-4 truncate cursor-text",
              "hover:bg-muted/50"
            )}
            onClick={() => setIsEditing(true)}
          >
            {value}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "size-8 opacity-0 group-hover:opacity-100 transition-opacity",
              isLoading && "opacity-100"
            )}
            onClick={processCell}
            disabled={isLoading}
          >
            <Sparkles className={cn(
              "size-4",
              isLoading && "animate-spin"
            )} />
          </Button>
        </div>
      )}
      
      {isEditing && (
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setIsEditing(true)}
          onBlur={onBlur}
          autoFocus
          className={cn(
            "absolute inset-0",
            "w-full h-full bg-muted",
            "focus:outline focus:ring-0 border-0",
            "px-4 leading-none",
            "flex items-center"
          )}
        />
      )}
    </div>
  );
}, (prev, next) => {
  return (
    prev.getValue()?.toString() === next.getValue()?.toString() &&
    prev.row.index === next.row.index &&
    prev.column.columnDef.accessorKey === next.column.columnDef.accessorKey
  );
}); 