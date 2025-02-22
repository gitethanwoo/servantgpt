"use client";

import { useMemo } from "react";
import { 
  useReactTable, 
  getCoreRowModel, 
  flexRender, 
  getSortedRowModel,
  Column,
  ColumnDef 
} from "@tanstack/react-table";
import { Table, TableHead, TableRow, TableCell, TableBody, TableHeader } from "@/components/ui/table";
import { AICellWrapper, EditableCellWrapper } from "./cellWrappers";
import { ColumnHeader } from "./ColumnHeader";
import { TableData, TableColumnDef, DataTableProps, TableMeta } from "./types";

// Move styles to constants to prevent recreation
const COLUMN_STYLES = { width: '200px', whiteSpace: 'nowrap' as const };
const CELL_STYLES = { width: '200px' };

const defaultColumn = {
  size: 400,
  cell: EditableCellWrapper,
};

export function DataTable({ 
  data, 
  columns,
  onUpdateCell,
  onCreateAIColumn,
  onUpdateAIColumn,
  onDeleteColumn,
}: DataTableProps) {
  // Memoize handlers to maintain stable references
  const handlers = useMemo(() => ({
    onDeleteColumn,
    onCreateAIColumn,
    onUpdateAIColumn,
    onUpdateCell,
  }), [onDeleteColumn, onCreateAIColumn, onUpdateAIColumn, onUpdateCell]);

  // Memoize columns to prevent unnecessary re-renders
  const processedColumns = useMemo(() => {
    return columns.map(col => ({
      ...col,
      enableSorting: true,
      accessorKey: col.accessorKey || col.header?.toString() || col.id || 'column',
      cell: col.meta?.type === 'ai' ? AICellWrapper : EditableCellWrapper,
      size: 200,
      header: ({ column }: { column: Column<TableData, unknown> }) => (
        <ColumnHeader
          column={column}
          columns={columns}
          title={col.header?.toString() || col.accessorKey}
          onDelete={() => handlers.onDeleteColumn((column.columnDef as TableColumnDef).accessorKey)}
          onCreateAI={(position: "left" | "right") => 
            handlers.onCreateAIColumn(position, (column.columnDef as TableColumnDef).accessorKey)
          }
          onUpdateAI={(options) => {
            if (options.prompt !== undefined) {
              handlers.onUpdateAIColumn((column.columnDef as TableColumnDef).accessorKey, options);
            }
          }}
        />
      ),
    }));
  }, [columns, handlers]);

  // Create table instance with stable references
  const table = useReactTable({
    data, // data now has stable reference from parent
    columns: processedColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    meta: {
      updateData: (rowIndex: number, columnId: string, value: any) => {
        handlers.onUpdateCell(rowIndex, columnId, value);
      },
    } as TableMeta,
    defaultColumn,
  });

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 relative">
        <div className="absolute inset-0 overflow-auto">
          <div className="inline-block min-w-full">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10 shadow-xs">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead 
                        key={header.id}
                        style={COLUMN_STYLES}
                      >
                        {!header.isPlaceholder && 
                          flexRender(header.column.columnDef.header, header.getContext())
                        }
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell 
                        key={cell.id} 
                        className="p-0 h-10 relative"
                        style={CELL_STYLES}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
