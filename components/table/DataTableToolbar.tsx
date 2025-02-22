"use client";

import { useRef, memo } from "react";
import { Button } from "@/components/ui/button";
import { useCSVParser } from "./useCSVParser";
import { TableData, TableColumnDef } from "./types";

interface DataTableToolbarProps {
  onCSVUpload: (data: TableData[], columns: TableColumnDef[]) => void;
}

export const DataTableToolbar = memo(function DataTableToolbar({ 
  onCSVUpload, 
}: DataTableToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { parseCSV } = useCSVParser();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        console.log('CSV Upload - Starting parse of file:', file.name);
        const { data, columns } = await parseCSV(file);
        console.log('CSV Upload - Parse successful:', { dataLength: data.length, columnsLength: columns.length });
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
});
