"use client";

import { useEffect, useRef, useState } from "react";
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
  PaginationState,
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
import { ArrowUpDown, CalendarIcon, Check } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/calendar";
import { DateRange } from "react-day-picker";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuLabel,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { ja } from "date-fns/locale/ja";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const columns: ColumnDef<TlogfileMetadata>[] = [
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
      <ScrollArea>
        <div className="flex gap-1 px-2 overflow-auto">
          {(row.getValue("tag") as string[]).map((t, i) => (
            <Badge key={`tag_${row.id}_${i}`} className="whitespace-nowrap">
              {t}
            </Badge>
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="hidden" />
      </ScrollArea>
    ),
    meta: {
      th: "w-[40%] text-center",
      td: "relative p-0 mask-gradient",
    },
    filterFn: (row, columnId, filterValue: string[]) => {
      const rowTags = row.getValue(columnId) as string[];
      let res = true;
      filterValue.forEach((f) => {
        res &&= rowTags.includes(f);
      });
      return res;
    },
  },
];

const IndexPage = () => {
  const [logfile, setlogfile] = useState<TlogfileMetadata[]>([]);
  const isLogfileLoaded = useRef(false); // logfileのロードが完了したかのフラグ
  const [sorting, setSorting] = useState<SortingState>([
    { id: "date", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const pageIndex = 0;
  const pageSize = 10;
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex,
    pageSize,
  });
  const isDataUpdating = useRef(false); // setlogfileでonPaginationChangeが発火しないようにするためのフラグ
  useEffect(() => {
    (async () => {
      const data = await window.electron.logfilesGet();
      setlogfile(data);
      isLogfileLoaded.current = true;
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
      pagination,
    },
    onPaginationChange: (updater) => {
      if (isDataUpdating.current) return;
      const newPagination =
        typeof updater === "function" ? updater(pagination) : updater;
      setPagination(newPagination);
    },
  });
  const minPage = 0;
  const maxPage = table.getPageCount() - 1;
  const currentPage = table.getState().pagination.pageIndex;

  const router = useRouter();
  const jump = (path: string) => {
    router.push(path);
  };

  interface Tcommand {
    value: string;
    label: string;
  }
  let taglist: Tcommand[] = logfile.reduce(
    (a, l) =>
      a.concat(
        l.tag.map((t) => ({ value: t.trim(), label: t.trim() } as Tcommand))
      ),
    [] as Tcommand[]
  );
  taglist.sort((a, b) => a.label.localeCompare(b.label, "ja"));
  taglist = taglist.filter((e, i, a) => !(i && a[i - 1].label == e.label));

  interface TmodifierData {
    data: TlogfileMetadata;
    set: (path: string, type: "name" | "date" | "tag", data: unknown) => void;
  }
  const modifier: TmodifierData = {
    data: {
      name: "",
      path: "",
      date: 0,
      tag: [],
      tabs: {}
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
      window.electron.logfileSet(modifier.data);
      isDataUpdating.current = true;
      setlogfile((prev) =>
        prev.map((l) => (l.path == modifier.data.path ? modifier.data : l))
      );
      setTimeout(() => {
        isDataUpdating.current = false;
      }, 0);
    },
  };

  let clickType: "left" | "right" = "left";

  const dateRange = table.getColumn("date")?.getFilterValue() as DateRange;
  const selectedTag = (table.getColumn("tag")?.getFilterValue() ||
    []) as string[];

  const rowSpan = pageSize - table.getRowModel().rows?.length;
  return (
    <>
      <div className="my-3 flex gap-2">
        <div className="flex flex-col w-[33%]">
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
        <div className="flex flex-col w-[33%]">
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
                locale={ja}
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
        <div className="flex flex-col w-[33%]">
          <Label htmlFor="search_tag" className="text-sm text-gray-500">
            tag
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                id="search_tag"
                className="flex justify-start overflow-x-auto"
              >
                {selectedTag?.length
                  ? selectedTag.map((s, i) => (
                      <Badge key={`selectedtag_${i}`}>
                        {taglist.find((t) => t.value == s)?.label}
                      </Badge>
                    ))
                  : ""}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Command>
                <CommandInput />
                <CommandList>
                  <CommandEmpty>タグが見つかりませんでした。</CommandEmpty>
                  <CommandGroup>
                    {taglist.map((tag) => (
                      <CommandItem
                        key={tag.value}
                        value={tag.value}
                        onSelect={(currentValue) => {
                          table
                            .getColumn("tag")
                            ?.setFilterValue(
                              selectedTag?.includes(currentValue)
                                ? selectedTag.filter((e) => e != currentValue)
                                : selectedTag.concat(currentValue)
                            );
                        }}
                      >
                        <Check
                          className={`mr-2 h-4 w-4 ${
                            selectedTag?.includes(tag.value)
                              ? "opacity-100"
                              : "opacity-0"
                          }`}
                        />
                        {tag.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
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
          {!isLogfileLoaded.current ? (
            [...Array(10)].map((_, i) => (
              <TableRow key={`row_skeleton_${i}`}>
                {[...Array(3)].map((_, j) => (
                  <TableCell key={`cell_skeleton_${i}_${j}`}>
                    <Skeleton className="w-full h-5" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : table.getRowModel().rows?.length ? (
            <>
              {table.getRowModel().rows.map((row) => (
                <ContextMenu key={row.id}>
                  <ContextMenuTrigger asChild>
                    <TableRow
                      data-state={row.getIsSelected() && "selected"}
                      onClick={() => {
                        const path =
                          "./detail?id=" +
                          encodeURIComponent(row.original.path);
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
                          className="py-2 border rounded-md shadow-sm"
                          locale={ja}
                          selected={new Date(row.original.date)}
                          defaultMonth={
                            new Date(row.original.date || Date.now())
                          }
                          onDayClick={(date) => {
                            modifier.set(row.id, "date", date);
                          }}
                        />
                      </div>
                      <div className="flex flex-col p-1">
                        <Label className="text-xs text-gray-500">tag</Label>
                        <Input
                          type="text"
                          defaultValue={row.original.tag.join(" ")}
                          onChange={(e) => {
                            modifier.set(
                              row.id,
                              "tag",
                              e.target.value.split(" ").filter((i) => i)
                            );
                          }}
                        ></Input>
                      </div>
                    </ContextMenuGroup>
                  </ContextMenuContent>
                </ContextMenu>
              ))}
              {[...Array(rowSpan)].map((_, i) => (
                <TableRow
                  key={`blank_row_${i}`}
                  className="border-transparent hover:bg-transparent"
                >
                  <TableCell
                    colSpan={columns.length}
                    className="box-content h-[1lh]"
                  ></TableCell>
                </TableRow>
              ))}
            </>
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <IndexPagination
        table={table}
        currentPage={currentPage}
        minPage={minPage}
        maxPage={maxPage}
      />
    </>
  );
};

const IndexPagination = ({
  table,
  currentPage,
  minPage,
  maxPage,
}: {
  table: import("@tanstack/table-core").Table<TlogfileMetadata>;
  currentPage: number;
  minPage: number;
  maxPage: number;
}) => {
  if (maxPage < minPage) return null;
  const centerStart = Math.max(minPage, currentPage - 2);
  const centerEnd = Math.min(maxPage, currentPage + 2);
  const centerCount = centerEnd - centerStart + 1;
  const leftEllipsis = Math.max(
    currentPage - 2 > minPage + 1 ? 1 : 0,
    Math.min(5, maxPage - minPage - 3) - Math.max(0, maxPage - currentPage)
  );
  const rightEllipsis = Math.max(
    currentPage + 2 < maxPage - 1 ? 1 : 0,
    Math.min(5, maxPage - minPage - 3) - Math.max(0, currentPage - minPage)
  );
  return (
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
        {currentPage - minPage > 2 && (
          <PaginationItem key={`page_${minPage + 1}`}>
            <PaginationLink
              onClick={() => {
                table.setPageIndex(minPage);
              }}
              isActive={currentPage == minPage}
            >
              {minPage + 1}
            </PaginationLink>
          </PaginationItem>
        )}
        {leftEllipsis > 0 &&
          [...Array(leftEllipsis)].map((_, i) => (
            <PaginationItem key={`page_left_ellipsis_${i}`}>
              <PaginationEllipsis className="opacity-20" />
            </PaginationItem>
          ))}
        {[...Array(centerCount)]
          .map((_, i) => i + centerStart)
          .map((i) => (
            <PaginationItem key={`page_${i + 1}`}>
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
        {rightEllipsis > 0 &&
          [...Array(rightEllipsis)].map((_, i) => (
            <PaginationItem key={`page_right_ellipsis_${i}`}>
              <PaginationEllipsis className="opacity-20" />
            </PaginationItem>
          ))}
        {maxPage - currentPage > 2 && (
          <PaginationItem key={`page_${maxPage + 1}`}>
            <PaginationLink
              onClick={() => {
                table.setPageIndex(maxPage);
              }}
              isActive={currentPage == maxPage}
            >
              {maxPage + 1}
            </PaginationLink>
          </PaginationItem>
        )}
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
  );
};

export default IndexPage;
