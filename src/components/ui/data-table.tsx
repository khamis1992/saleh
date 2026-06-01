import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileX,
} from 'lucide-react';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  /** Show search bar (default: true) */
  searchable?: boolean;
  /** Search placeholder text */
  searchPlaceholder?: string;
  /** Column to search by default (default: searches all string columns) */
  searchColumn?: string;
  /** Show pagination (default: true) */
  paginated?: boolean;
  /** Rows per page options */
  pageSizeOptions?: number[];
  /** Default page size */
  defaultPageSize?: number;
  /** Show column visibility toggle (default: false) */
  columnToggle?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Empty state icon */
  emptyIcon?: React.ReactNode;
  /** Extra toolbar content (rendered between search and page size) */
  toolbar?: React.ReactNode;
  /** On row click handler */
  onRowClick?: (row: TData) => void;
}

/**
 * DataTable — matches the standard /lands design.
 * - White card container (rounded-xl, shadow-sm, border-gray-100, overflow-hidden)
 * - Header bg-[#F9FAFB], h-11, text-[12px] font-semibold text-gray-500
 * - Body rows border-gray-50, hover:bg-[#F9FAFB]
 * - Footer pagination: rows-per-page Select, "X-Y من N" counter, numbered page buttons (active blue), prev/next
 */
export function DataTable<TData, TValue>({
  columns,
  data,
  searchable = true,
  searchPlaceholder = 'بحث...',
  paginated = true,
  pageSizeOptions = [6, 10, 20, 50],
  defaultPageSize = 10,
  columnToggle = false,
  emptyMessage = 'لا توجد بيانات',
  emptyIcon,
  toolbar,
  onRowClick,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
    },
    initialState: {
      pagination: { pageSize: defaultPageSize },
    },
  });

  const totalRows = table.getFilteredRowModel().rows.length;
  const { pageIndex, pageSize } = table.getState().pagination;
  const pageCount = table.getPageCount();
  const start = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const end = Math.min((pageIndex + 1) * pageSize, totalRows);

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      {(searchable || toolbar) && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex flex-wrap items-center gap-2">
          {searchable && (
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
              <Input
                placeholder={searchPlaceholder}
                value={globalFilter ?? ''}
                onChange={(e) => setGlobalFilter(String(e.target.value))}
                className="pr-10 h-9 text-sm rounded-lg border-gray-200 bg-gray-50 focus:bg-white"
              />
            </div>
          )}
          {toolbar}
        </div>
      )}

      {/* Table */}
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const isSorted = header.column.getIsSorted();
                return (
                  <TableHead
                    key={header.id}
                    className={canSort ? 'cursor-pointer select-none' : ''}
                    onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {canSort && (
                        <span className="text-gray-300">
                          {isSorted === 'asc' ? (
                            <ArrowUp className="h-3 w-3 text-gray-600" />
                          ) : isSorted === 'desc' ? (
                            <ArrowDown className="h-3 w-3 text-gray-600" />
                          ) : (
                            <ArrowUpDown className="h-3 w-3" />
                          )}
                        </span>
                      )}
                    </div>
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center py-16">
                <div className="flex flex-col items-center gap-2">
                  {emptyIcon || (
                    <div className="h-12 w-12 rounded-full bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
                      <FileX className="h-5 w-5 text-gray-300" />
                    </div>
                  )}
                  <p className="text-sm font-semibold text-gray-400">{emptyMessage}</p>
                  <p className="text-xs text-gray-300">لم يتم العثور على أي نتائج</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className={onRowClick ? 'cursor-pointer' : ''}
                onClick={onRowClick ? () => onRowClick(row.original) : undefined}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Pagination footer — matches the /lands design */}
      {paginated && totalRows > 0 && (
        <div className="py-3 border-t border-gray-100 bg-[#FAFBFC] flex items-center justify-between flex-wrap gap-3 rounded-b-xl">
          <div className="flex items-center gap-2">
            <Select
              value={String(pageSize)}
              onValueChange={(v) => table.setPageSize(Number(v))}
            >
              <SelectTrigger className="h-8 w-[70px] text-xs border-gray-200 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-gray-500">لكل صفحة</span>
          </div>

          <span className="text-xs text-gray-500">
            عرض <span className="font-bold text-[#1E293B]">{start}</span> -{' '}
            <span className="font-bold text-[#1E293B]">{end}</span> من{' '}
            <span className="font-bold text-[#1E293B]">{totalRows}</span>
          </span>

          <div className="flex items-center gap-1">
            <Button
              variant="outline" size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="h-8 px-2 text-xs border-gray-200 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-40 gap-1"
            >
              <ChevronRight className="h-3.5 w-3.5" />
              السابق
            </Button>
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => table.setPageIndex(page - 1)}
                className={`h-8 min-w-[32px] px-2 rounded-lg text-xs font-bold flex items-center justify-center transition-colors ${
                  pageIndex + 1 === page
                    ? 'bg-[#3B82F6] text-white'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            <Button
              variant="outline" size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="h-8 px-2 text-xs border-gray-200 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-40 gap-1"
            >
              التالي
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Helper to create a sortable header column
 */
export function createSortableHeader(label: string) {
  return function SortableHeader() {
    return <span>{label}</span>;
  };
}
