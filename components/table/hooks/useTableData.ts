import { useState, useCallback } from 'react';
import { TableData } from '../types';

export interface UseTableDataProps {
  onDataChange?: (data: TableData[]) => void;
}

export function useTableData({ onDataChange }: UseTableDataProps = {}) {
  const [data, setData] = useState<TableData[]>([]);

  const updateData = useCallback((newData: TableData[]) => {
    const freshData = [...newData];
    setData(freshData);
    onDataChange?.(freshData);
  }, [onDataChange]);

  const updateCell = useCallback((rowIndex: number, columnId: string, value: any) => {
    setData(oldData => oldData.map((row, index) => 
      index === rowIndex ? { ...row, [columnId]: value } : row
    ));
  }, []);

  const addColumn = useCallback((columnId: string, defaultValue: any = null) => {
    setData(oldData => oldData.map(row => ({
      ...row,
      [columnId]: defaultValue
    })));
  }, []);

  const deleteColumn = useCallback((columnId: string) => {
    setData(oldData => oldData.map(row => {
      const { [columnId]: _, ...rest } = row;
      return rest;
    }));
  }, []);

  return {
    data,
    setData: updateData,
    updateCell,
    addColumn,
    deleteColumn
  };
} 