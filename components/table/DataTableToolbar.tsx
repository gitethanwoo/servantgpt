"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { useCSVParser } from "./useCSVParser";
import { TableData } from "./DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { EditableCell } from "./editableCell";

interface DataTableToolbarProps {
  data: TableData[];
  columns: ColumnDef<TableData, any>[];
  onCSVUpload: (data: TableData[], columns: ColumnDef<TableData, any>[]) => void;
  onAddColumn: (position: "left" | "right", referenceColumnId?: string) => void;
}

export function DataTableToolbar({ data, columns, onCSVUpload, onAddColumn }: DataTableToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { parseCSV } = useCSVParser();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const { data, columns } = await parseCSV(file);
        onCSVUpload(data, columns);
      } catch (error) {
        console.error('Failed to parse CSV:', error);
        // You might want to show an error toast here
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="flex items-center gap-4 pb-4">
      <input
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className="hidden"
        ref={fileInputRef}
      />
      <Button
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
      >
        Upload CSV
      </Button>
    </div>
  );
}
