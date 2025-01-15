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
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useRouter } from "next/navigation";

const columns: ColumnDef<TlogTableColumn>[] = [
  {
    accessorKey: "name",
    header: "名前",
    meta: {
      className: "truncate max-w-0 w-[50%]",
    },
  },
  {
    accessorKey: "date",
    header: "日付",
    cell: ({ row }) => {
      const date = new Date(row.getValue("date"));
      return date.toLocaleDateString();
    },
    meta: {
      className: "w-[10%] text-center",
    },
  },
  {
    accessorKey: "tag",
    header: "タグ",
    meta: {
      className: "w-[40%]",
    },
  },
];

const IndexPage = () => {
  const [logfile, setlogfile] = useState([] as TlogTableColumn[]);
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
  });

  const router = useRouter();
  const jump = (path: string) => {
    router.push(path);
  };
  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              return (
                <TableHead key={header.id} className="text-center">
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
            <TableRow
              key={row.id}
              data-state={row.getIsSelected() && "selected"}
              onClick={() => {
                const path = "./detail?id=" + encodeURIComponent(row.original.path);
                jump(path);
              }}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  className={
                    !!cell.column.columnDef.meta
                      ? // @ts-expect-error: classNameが型では定義さててないので
                        cell.column.columnDef.meta?.className
                      : ""
                  }
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
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
  );
};

export default IndexPage;
