"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, CalendarIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuLabel,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Badge } from "@/components/ui/badge";

const columns: ColumnDef<TlogTableColumn>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          名前
          <ArrowUpDown className="ml-2" />
        </Button>
      );
    },
    meta: {
      th: "w-[50%] text-center",
      td: "truncate max-w-0",
    },
    filterFn: (row, columnId, filterValue: string) => {
      const filterValues = filterValue.split(" ");
      const rowText = row.getValue(columnId) as string;
      let res = true;
      filterValues.forEach((f) => {
        res &&= rowText.includes(f);
      });
      return res;
    },
  },
  {
    accessorKey: "date",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          日付
          <ArrowUpDown className="ml-2" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("date"));
      return date.toLocaleDateString();
    },
    meta: {
      th: "w-[10em] text-center",
      td: "text-center",
    },
    filterFn: (row, columnId, filterValue) => {
      const rowDate = new Date(row.getValue(columnId));
      let res = true;
      if (!!filterValue?.from) res &&= rowDate >= filterValue.from;
      if (!!filterValue?.to) res &&= rowDate <= filterValue.to;
      return res;
    },
  },
  {
    accessorKey: "tag",
    header: "タグ",
    cell: ({ row }) => (
      <div className="flex gap-1 px-2 overflow-auto">
        {(row.getValue("tag") as string[]).map((t, i) => (
          <Badge key={`tag_${row.id}_${i}`}>{t}</Badge>
        ))}
      </div>
    ),
    meta: {
      th: "w-[40%] text-center",
      td: "relative px-0 mask-gradient",
    },
  },
];

const IndexPage = () => {
  const [logfile, setlogfile] = useState([] as TlogTableColumn[]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  useEffect(() => {
    (async () => {
      const data = await window.electron.logfileGet();
      setlogfile(data);
    })();
  }, []);
  const table = useReactTable({
    data: logfile,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });
  const minPage = 0;
  const maxPage = table.getPageCount() - 1;
  const currentPage = table.getState().pagination.pageIndex;

  const router = useRouter();
  const jump = (path: string) => {
    router.push(path);
  };

  interface TmodifierData {
    data: TlogTableColumn;
    set: (path: string, type: "name" | "date" | "tag", data: unknown) => void;
  }
  const modifier: TmodifierData = {
    data: {
      name: "",
      path: "",
      date: 0,
      tag: [],
    },
    set: (id, type, data) => {
      const row = table.getRow(id);
      if (modifier.data?.path != row.original.path)
        modifier.data = row.original;
      switch (type) {
        case "name":
          if (typeof data != "string") return;
          modifier.data.name = data;
          break;
        case "date":
          if (!(data instanceof Date)) return;
          modifier.data.date = data.getTime();
          break;
        case "tag":
          if (
            Array.isArray(data) &&
            data.reduce((s, i) => s || typeof i != "string", false)
          )
            return;
          modifier.data.tag = data as string[];
          break;
        default:
          return;
      }
      setlogfile((prev) =>
        prev.map((l) => (l.path == modifier.data.path ? modifier.data : l))
      );
    },
  };

  let clickType: "left" | "right" = "left";

  const dateRange = table.getColumn("date")?.getFilterValue() as DateRange;
  return (
    <>
      <div className="mb-3 flex gap-2">
        <div className="flex flex-col flex-1">
          <Label htmlFor="search_text" className="text-sm text-gray-500">
            name
          </Label>
          <Input
            id="search_text"
            type="text"
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
          />
        </div>
        <div className="flex flex-col flex-1">
          <Label htmlFor="search_date" className="text-sm text-gray-500">
            date
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant={"outline"} id="search_date" className="flex">
                <div className="flex-1">
                  {(dateRange?.from && dateRange?.to && (
                    <span>
                      {dateRange.from.toLocaleDateString()} -{" "}
                      {dateRange.to.toLocaleDateString()}
                    </span>
                  )) ||
                    (dateRange?.from && (
                      <span>{dateRange.from.toLocaleDateString()} -</span>
                    )) ||
                    (dateRange?.to && (
                      <span>- {dateRange.to.toLocaleDateString()}</span>
                    )) || <span></span>}
                </div>
                <CalendarIcon />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0"
              onClick={() => {
                clickType = "left";
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                clickType = "right";
                const dayElement = (e.target as HTMLElement).closest(
                  "button[name='day']"
                ) as HTMLElement;
                if (dayElement) dayElement.click();
              }}
            >
              <Calendar
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onDayClick={(day) => {
                  table.getColumn("date")?.setFilterValue({
                    from: clickType == "left" ? day : dateRange?.from,
                    to: clickType == "right" ? day : dateRange?.to,
                  });
                }}
                initialFocus
                footer={
                  <>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        table.getColumn("date")?.setFilterValue(null);
                      }}
                    >
                      clear
                    </Button>
                    <div className="mt-2 mx-auto text-xs text-gray-500">
                      左クリックで<span className="font-semibold">開始日</span>
                      を設定、
                      <br />
                      右クリックで <span className="font-semibold">終了日</span>
                      を設定できます。
                    </div>
                  </>
                }
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex flex-col flex-1">
          <Label htmlFor="search_tag" className="text-sm text-gray-500">
            tag
          </Label>
          <Input id="search_tag" type="text" placeholder="tag" />
        </div>
      </div>
      <Table className="table-fixed">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead
                    key={header.id}
                    className={
                      // @ts-expect-error: th設定済み
                      header.column.columnDef.meta.th
                    }
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <ContextMenu key={row.id}>
                <ContextMenuTrigger asChild>
                  <TableRow
                    data-state={row.getIsSelected() && "selected"}
                    onClick={() => {
                      const path =
                        "./detail?id=" + encodeURIComponent(row.original.path);
                      jump(path);
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={
                          // @ts-expect-error: td設定済み
                          cell.column.columnDef.meta.td
                        }
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuLabel>データ編集</ContextMenuLabel>
                  <ContextMenuGroup>
                    <div className="flex flex-col p-1">
                      <Label className="text-xs text-gray-500">name</Label>
                      <Input
                        type="text"
                        defaultValue={row.original.name}
                        onChange={(e) => {
                          modifier.set(row.id, "name", e.target.value);
                        }}
                      ></Input>
                    </div>
                    <div className="flex flex-col p-1">
                      <Label className="text-xs text-gray-500">date</Label>
                      <Calendar
                        selected={new Date(row.original.date)}
                        onDayClick={(date) => {
                          modifier.set(row.id, "date", date);
                        }}
                      />
                    </div>
                    <div className="flex flex-col p-1">
                      <Label className="text-xs text-gray-500">tag</Label>
                      <Input
                        type="text"
                        defaultValue={row.original.tag}
                        onChange={(e) => {
                          modifier.set(
                            row.id,
                            "tag",
                            e.target.value.split(" ").filter((i) => i)
                          );
                        }}
                      ></Input>
                    </div>
                    <Button className="m-1 right-0" onClick={() => {}}>
                      更新
                    </Button>
                  </ContextMenuGroup>
                </ContextMenuContent>
              </ContextMenu>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <Pagination className="mt-4">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => {
                table.previousPage();
              }}
              aria-disabled={currentPage <= minPage}
              tabIndex={currentPage <= minPage ? -1 : undefined}
              className={
                currentPage <= minPage
                  ? "pointer-events-none opacity-50"
                  : undefined
              }
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink
              onClick={() => {
                table.setPageIndex(minPage);
              }}
              isActive={currentPage == minPage}
            >
              {minPage + 1}
            </PaginationLink>
          </PaginationItem>
          {currentPage > minPage + 3 && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}
          {[...Array(5)]
            .map((_, i) => i + currentPage - 2)
            .filter((i) => i > minPage && i < maxPage)
            .map((i) => (
              <PaginationItem key={i}>
                <PaginationLink
                  onClick={() => {
                    table.setPageIndex(i);
                  }}
                  isActive={i == currentPage}
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
          {currentPage < maxPage - 3 && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}
          <PaginationItem>
            <PaginationLink
              onClick={() => {
                table.setPageIndex(maxPage);
              }}
              isActive={currentPage == maxPage}
            >
              {maxPage + 1}
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              onClick={() => {
                table.nextPage();
              }}
              aria-disabled={currentPage >= maxPage}
              tabIndex={currentPage >= maxPage ? -1 : undefined}
              className={
                currentPage >= maxPage
                  ? "pointer-events-none opacity-50"
                  : undefined
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </>
  );
};

export default IndexPage;
