import { Button } from "@/components/ui/button";
import { Table } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface paginationProps {
  val: number;
  min?: number;
  max: number;
  table: Table<TlogTableColumn>;
}

const Pagination = (props: paginationProps) => {
  const currentPage = props.val;
  const minPage = props.min || 1;
  const maxPage = props.max;
  const table = props.table;
  return (
    <div className="flex gap-1 justify-center">
      <Button
        variant="outline"
        disabled={currentPage <= minPage}
        onClick={() => {
          table.previousPage();
        }}
      >
        <ChevronLeft />
      </Button>
      <PaginationButton
        val={minPage}
        variant={minPage != currentPage ? "outline" : undefined}
        table={table}
      />
      {currentPage > minPage + 3 && <span>...</span>}
      {[...Array(5)]
        .map((_, i) => i + currentPage - 2)
        .filter((i) => i > 1 && i < maxPage)
        .map((i) => (
          <PaginationButton
            val={i}
            variant={i != currentPage ? "outline" : undefined}
            table={table}
            key={`paginationButton_${i}`}
          />
        ))}
      {currentPage < maxPage - 3 && <span>...</span>}
      {minPage != maxPage && (
        <PaginationButton
          val={maxPage}
          variant={maxPage != currentPage ? "outline" : undefined}
          table={table}
        />
      )}
      <Button
        variant="outline"
        disabled={currentPage >= maxPage}
        onClick={() => {
          table.nextPage();
        }}
      >
        <ChevronRight />
      </Button>
    </div>
  );
};

const PaginationButton = (props: {
  val: number;
  variant?:
    | "link"
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | null
    | undefined;
  table: Table<TlogTableColumn>;
}) => {
  const val = props.val;
  const variant = props.variant;
  const table = props.table;
  return (
    <Button
      variant={variant}
      onClick={() => {
        table.setPageIndex(val - 1);
      }}
    >
      {val}
    </Button>
  );
};

export default Pagination;
