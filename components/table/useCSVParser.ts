import { parse } from "papaparse";
import { TableData, TableColumnDef } from "./types";
import { EditableCell } from "./editableCell";

interface CSVParseResult {
  data: TableData[];
  columns: TableColumnDef[];
}

// Helper to check if a string is a date
function isDateString(str: string): boolean {
  // Common date formats: MM/DD/YYYY, YYYY-MM-DD, DD-MM-YYYY, etc.
  const datePatterns = [
    /^\d{1,2}[/-]\d{1,2}[/-]\d{4}$/, // MM/DD/YYYY or DD/MM/YYYY
    /^\d{4}[/-]\d{1,2}[/-]\d{1,2}$/, // YYYY-MM-DD
    /^\d{1,2}[/-]\w{3}[/-]\d{4}$/, // DD-MMM-YYYY
  ];
  return datePatterns.some(pattern => pattern.test(str));
}

// Helper to parse a date string consistently
function parseDate(str: string): Date | null {
  const date = new Date(str);
  return isNaN(date.getTime()) ? null : date;
}

export function useCSVParser() {
  const parseCSV = (file: File): Promise<CSVParseResult> => {
    return new Promise((resolve, reject) => {
      parse<TableData>(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        transformHeader: (header) => {
          const cleaned = header.trim().replace(/[^\w\s]/g, '_');
          return cleaned;
        },
        complete: (results) => {
          if (results.errors.length > 0) {
            reject(new Error(`CSV parsing errors: ${results.errors.map(e => e.message).join(', ')}`));
            return;
          }

          const data = results.data;
          if (data.length === 0) {
            reject(new Error("No data found in CSV file"));
            return;
          }

          const sampleSize = Math.min(10, data.length);
          const columnTypes = new Map<string, 'date' | 'regular'>();
          
          Object.keys(data[0]).forEach(key => {
            const samples = data
              .slice(0, sampleSize)
              .map(row => row[key]?.toString())
              .filter((sample): sample is string => Boolean(sample));

            const isDate = samples.length > 0 && 
              samples.every(sample => isDateString(sample));
            
            columnTypes.set(key, isDate ? 'date' : 'regular');
          });

          // Create columns with appropriate sorting
          const columns: TableColumnDef[] = Object.keys(data[0]).map((key) => ({
            accessorKey: key,
            header: key,
            cell: EditableCell,
            meta: {
              type: 'regular'
            },
            sortingFn: columnTypes.get(key) === 'date' 
              ? (rowA, rowB, columnId) => {
                  const a = parseDate(rowA.getValue(columnId)?.toString() || '');
                  const b = parseDate(rowB.getValue(columnId)?.toString() || '');
                  if (!a && !b) return 0;
                  if (!a) return -1;
                  if (!b) return 1;
                  return a.getTime() - b.getTime();
                }
              : undefined
          }));

          // Ensure we're working with fresh arrays
          const freshData = data.map(row => ({ ...row })); // New reference for each row
          const freshColumns = columns.map(col => ({ ...col })); // New reference for each column
          // Return new references
          resolve({ 
            data: freshData,
            columns: freshColumns
          });
        },
        error: (error) => {
          console.error('CSV Parse - Error:', error);
          reject(error);
        },
      });
    });
  };

  return { parseCSV };
}
