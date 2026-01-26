// src/components/ui/Table.tsx
import React from 'react';
import { EmptyState } from './EmptyState';

interface Column<T> {
  key: string;
  header: string;
  render: (item: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  rowKey: keyof T | ((item: T) => string | number); 
  onRowClick?: (item: T) => void;
  // Added rowClassName to support dynamic row styling
  rowClassName?: (item: T) => string;
  loading?: boolean;
  emptyState?: {
    icon?: React.ReactNode;
    title: string;
    description: string;
    action?: React.ReactNode;
  };
}

export function Table<T>({
  data,
  columns,
  rowKey,
  onRowClick,
  rowClassName,
  loading,
  emptyState,
}: TableProps<T>) {

  const getRowId = (item: T): string | number => {
    if (typeof rowKey === 'function') return rowKey(item);
    return item[rowKey] as unknown as string | number;
  };

  if (loading && data.length === 0) {
    return (
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                {columns.map((column) => (
                  <th key={column.key} className={`px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider ${column.className || ''}`}>
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={`skeleton-${i}`} className="animate-pulse">
                  {columns.map((col) => (
                    <td key={`skeleton-col-${col.key}`} className="px-6 py-4">
                      <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (data.length === 0 && emptyState) {
    return <EmptyState {...emptyState} />;
  }

  return (
    <div className="rounded-xl border bg-white overflow-hidden relative">
      {loading && data.length > 0 && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-10">
           <div className="h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className={`px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider ${column.className || ''}`}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item) => {
              const itemId = getRowId(item);
              // Calculate custom classes for this specific row
              const customRowClass = rowClassName ? rowClassName(item) : '';
              
              return (
                <tr
                  key={itemId}
                  onClick={() => onRowClick?.(item)}
                  className={`transition-colors ${onRowClick ? 'hover:bg-gray-50 cursor-pointer' : ''} ${customRowClass}`}
                >
                  {columns.map((column) => (
                    <td key={`${itemId}-${column.key}`} className={`px-6 py-4 ${column.className || ''}`}>
                      {column.render(item)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}