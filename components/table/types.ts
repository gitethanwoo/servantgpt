import { ColumnDef, Table, Column, CellContext } from "@tanstack/react-table";

// Base data type
export type TableData = Record<string, string | number | null>;

// Column meta information
export interface ColumnMeta {
  type: 'regular' | 'ai';  // Make type required
  prompt?: string;
  headerText?: string;
}

// Column operations
export interface ColumnOperations {
  onDeleteColumn: (columnId: string) => void;
  onUpdateAIColumn: (columnId: string, options: { name?: string; prompt?: string }) => void;
  onCreateAIColumn: (position: "left" | "right", referenceColumnId?: string, options?: {
    type?: "regular" | "ai";
    name?: string;
    prompt?: string;
  }) => void;
  onProcessColumn?: (columnId: string) => Promise<void>;
}

// We'll extend the base ColumnDef type
export type TableColumnDef = ColumnDef<TableData> & {
  accessorKey: string;
  meta: ColumnMeta;
};

// Table meta information
export interface TableMeta {
  updateData: (rowIndex: number, columnId: string, value: any) => void;
  columnProcessTrigger?: {
    columnId: string;
    time: number;
  };
}

// Props for cell components
export interface CellProps extends CellContext<TableData, any> {
  column: Column<TableData, any> & {
    columnDef: TableColumnDef;
  };
  table: Table<TableData> & {
    options: {
      meta?: TableMeta;
    };
  };
}

// Props for the main DataTable component
export interface DataTableProps {
  data: TableData[];
  columns: TableColumnDef[];
  onUpdateCell: (rowIndex: number, columnId: string, value: any) => void;
  onCreateAIColumn: (position: "left" | "right", referenceColumnId?: string, options?: {
    type?: "regular" | "ai";
    name?: string;
    prompt?: string;
  }) => void;
  onUpdateAIColumn: (columnId: string, options: {
    name?: string;
    prompt?: string;
  }) => void;
  onDeleteColumn: (columnId: string) => void;
}

// Props for column header components
export interface ColumnHeaderProps {
  column: Column<TableData, unknown>;
  columns: TableColumnDef[];
  title: string;
  onDelete: () => void;
  onCreateAI: (position: "left" | "right") => void;
  onUpdateAI: (options: { name?: string; prompt?: string }) => void;
}

export interface ColumnHeaderMenuProps extends Pick<ColumnOperations, 'onDeleteColumn' | 'onProcessColumn'> {
  column: Column<TableData, unknown>;
}

// Add these interfaces
export interface AIColumnConfigProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: TableColumnDef[];
  currentColumnId?: string;
  currentPrompt?: string;
  position?: "left" | "right";
  referenceColumnId?: string;
  onSave?: (options: { name?: string; prompt?: string }) => void;
  onCreate?: (position: "left" | "right", referenceColumnId?: string, options?: {
    type?: "regular" | "ai";
    name?: string;
    prompt?: string;
  }) => void;
}

// Add these with the other type definitions
export type EditableCellWrapper = (props: CellContext<TableData, any>) => JSX.Element;
export type AICellWrapper = (props: CellContext<TableData, any>) => JSX.Element; 