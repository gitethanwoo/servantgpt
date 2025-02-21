import { memo, useState } from "react";
import { CellContext } from "@tanstack/react-table";
import { TableData } from "./DataTable";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useCompletion } from "ai/react";

interface AICellProps extends CellContext<TableData, any> {}

export const AICell = memo(function AICell({ 
  getValue, 
  row, 
  column, 
  table 
}: AICellProps) {
  const initialValue = getValue();
  const [value, setValue] = useState(initialValue?.toString() ?? "");
  const [isEditing, setIsEditing] = useState(false);

  const { complete, isLoading } = useCompletion({
    api: '/api/tools/table-ai',
    onResponse: (response) => {
      // This is called when the API returns a response
      if (!response.ok) {
        throw new Error('Failed to generate completion');
      }
    },
    onFinish: (prompt, completion) => {
      // This is called when the completion is done
      setValue(completion);
      (table.options.meta as any)?.updateData(row.index, column.id, completion);
    },
    onError: (error) => {
      console.error('Error processing AI prompt:', error);
      setValue('Error');
      (table.options.meta as any)?.updateData(row.index, column.id, 'Error');
    }
  });

  const processCell = async () => {
    const prompt = (column.columnDef.meta as any)?.prompt;
    if (!prompt) {
      console.error('No prompt configured');
      return;
    }

    // Replace {{columnId}} references with actual values
    const resolvedPrompt = prompt.replace(/\{\{(.*?)\}\}/g, (_: string, colId: string) => {
      return row.getValue(colId)?.toString() || '';
    });

    await complete(resolvedPrompt);
  };

  const onBlur = () => {
    setIsEditing(false);
    if (value !== initialValue?.toString()) {
      const newValue = typeof initialValue === 'number' ? Number(value) : value;
      (table.options.meta as any)?.updateData(row.index, column.id, newValue);
    }
  };

  return (
    <div className="relative size-full group">
      {/* Non-editing state with process button */}
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
      
      {/* Editing state */}
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
    prev.column.id === next.column.id
  );
}); 