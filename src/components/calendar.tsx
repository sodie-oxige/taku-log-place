import { Calendar as C, CalendarProps } from "@/components/ui/calendar";
import { useState } from "react";
import { Button } from "./ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

const Calendar = ({ ...props }: CalendarProps) => {
  const [displayMonth, setDisplayMonth] = useState<Date>(new Date());

  return (
    <C
      month={displayMonth}
      components={{
        Caption: ({ displayMonth }) => (
          <div className="flex justify-center pt-1 relative items-center">
            <Button
              variant="ghost"
              className="p-2"
              onClick={() =>
                setDisplayMonth(
                  new Date(
                    displayMonth.getFullYear() - 1,
                    displayMonth.getMonth()
                  )
                )
              }
            >
              <ChevronsLeft />
            </Button>
            <Button
              variant="ghost"
              className="p-2"
              onClick={() =>
                setDisplayMonth(
                  new Date(
                    displayMonth.getFullYear(),
                    displayMonth.getMonth() - 1
                  )
                )
              }
            >
              <ChevronLeft />
            </Button>
            <span className="flex-1 font-medium text-center">
              {displayMonth.getFullYear()} /{" "}
              {("0" + (displayMonth.getMonth() + 1)).slice(-2)}
            </span>
            <Button
              variant="ghost"
              className="p-2"
              onClick={() =>
                setDisplayMonth(
                  new Date(
                    displayMonth.getFullYear(),
                    displayMonth.getMonth() + 1
                  )
                )
              }
            >
              <ChevronRight />
            </Button>
            <Button
              variant="ghost"
              className="p-2"
              onClick={() =>
                setDisplayMonth(
                  new Date(
                    displayMonth.getFullYear() + 1,
                    displayMonth.getMonth()
                  )
                )
              }
            >
              <ChevronsRight />
            </Button>
          </div>
        ),
      }}
      {...props}
    />
  );
};

export { Calendar };
