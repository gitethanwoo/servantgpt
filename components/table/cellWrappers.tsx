import { CellContext } from "@tanstack/react-table";
import { TableData } from "./types";
import { EditableCell } from "./editableCell";
import { AICell } from "./AICell";

export const EditableCellWrapper = (props: CellContext<TableData, any>) => (
  <EditableCell {...props as any} />
);

export const AICellWrapper = (props: CellContext<TableData, any>) => (
  <AICell {...props as any} />
); 