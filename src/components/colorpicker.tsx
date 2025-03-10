import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ColorUtils } from "@root/module/color_utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface ColorPickerProps {
  value?: ColorUtils.HSL;
  onChange?: (color: ColorUtils.HSL) => void;
}

const ColorPicker = ({ value, onChange }: ColorPickerProps) => {
  const [hsl, setHsl] = useState<ColorUtils.HSL>(value ?? { h: 0, s: 100, l: 50 });
  const isMouseDown = useRef(false);

  const ColorPickerContent = () => {
    const onDragStart = () => {
      isMouseDown.current = true;
    };
    const onMouseMoveH = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isMouseDown.current) return;
      const elem = e.currentTarget;
      const rect = elem.getBoundingClientRect();
      const [w, _h] = [rect.width, rect.height];
      const x = e.clientX - rect.left;
      setHsl({ h: (x / w) * 360, s: hsl.s, l: hsl.l });
    };
    const onMouseMoveSL = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isMouseDown.current) return;
      const elem = e.currentTarget;
      const rect = elem.getBoundingClientRect();
      const [w, h] = [rect.width, rect.height];
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const hsv = { h: hsl.h, s: (x / w) * 100, v: (1 - y / h) * 100 };
      setHsl(ColorUtils.hsv2hsl(hsv));
    };
    const onDragEnd = () => {
      isMouseDown.current = false;
      onChange?.(hsl);
    };
    const onClickButton = (color: ColorUtils.HSL) => {
      setHsl(color);
      onChange?.(color);
    };

    return (
      <div className="flex flex-col gap-2">
        <div className="flex gap-1 justify-center">
          <Button
            variant={"outline"}
            className="p-0 w-9 aspect-square"
            onClick={() => onClickButton({ h: 0, s: 100, l: 90 })}
          >
            <div className="w-full h-full bg-[#ffcbcb]"></div>
          </Button>
          <Button
            variant={"outline"}
            className="p-0 w-9 aspect-square"
            onClick={() => onClickButton({ h: 60, s: 59, l: 74 })}
          >
            <div className="w-full h-full bg-[#e4e495]"></div>
          </Button>
          <Button
            variant={"outline"}
            className="p-0 w-9 aspect-square"
            onClick={() => onClickButton({ h: 120, s: 66, l: 83 })}
          >
            <div className="w-full h-full bg-[#b5f0b5]"></div>
          </Button>
          <Button
            variant={"outline"}
            className="p-0 w-9 aspect-square"
            onClick={() => onClickButton({ h: 180, s: 82, l: 74 })}
          >
            <div className="w-full h-full bg-[#87f3f3]"></div>
          </Button>
          <Button
            variant={"outline"}
            className="p-0 w-9 aspect-square"
            onClick={() => onClickButton({ h: 240, s: 100, l: 92 })}
          >
            <div className="w-full h-full bg-[#d8d8ff]"></div>
          </Button>
          <Button
            variant={"outline"}
            className="p-0 w-9 aspect-square"
            onClick={() => onClickButton({ h: 300, s: 100, l: 89 })}
          >
            <div className="w-full h-full bg-[#ffc7ff]"></div>
          </Button>
        </div>
        <div
          className="w-full aspect-[4/3] relative"
          style={{
            background: `
          linear-gradient(to top, hsl(0, 0.00%, 0.00%) 0%, rgba(0, 0, 0, 0) 100%),
          linear-gradient(to right, hsl(${hsl.h}, 0%, 100%) 0%, hsl(${hsl.h}, 100%, 50%) 100%)`,
          }}
          onMouseDown={onDragStart}
          onMouseLeave={onDragEnd}
          onMouseUp={onDragEnd}
          onMouseMove={onMouseMoveSL}
        >
          <Cursor
            x={ColorUtils.hsl2hsv(hsl).s / 100}
            y={1 - ColorUtils.hsl2hsv(hsl).v / 100}
            className="cursor_sv"
          />
        </div>

        <div
          className="w-full h-3 relative"
          style={{
            background:
              "linear-gradient(to right, hsl(0, 100%, 50%) 0% , hsl(30, 100%, 50%) 8.3% , hsl(60, 100%, 50%) 16.7% , hsl(90, 100%, 50%) 25% , hsl(120, 100%, 50%) 33.3% , hsl(150, 100%, 50%) 41.7% , hsl(180, 100%, 50%) 50% , hsl(210, 100%, 50%) 58.3% , hsl(240, 100%, 50%) 66.7% , hsl(270, 100%, 50%) 75% , hsl(300, 100%, 50%) 83.3% , hsl(330, 100%, 50%) 91.7% , hsl(0, 100%, 50%) 100%",
          }}
          onMouseDown={onDragStart}
          onMouseLeave={onDragEnd}
          onMouseUp={onDragEnd}
          onMouseMove={onMouseMoveH}
        >
          <Cursor x={hsl.h / 360} className="cursor_h" />
        </div>
      </div>
    );
  };

  interface CursorProps extends React.HTMLAttributes<HTMLDivElement> {
    x: number;
    y?: number;
  }
  const Cursor = ({ x, y, className, ...props }: CursorProps) => {
    const rx = Math.round(x * 100);
    const ry = Math.round((y || 0.5) * 100);
    return (
      <div
        className={cn("absolute top-0 left-0 flex w-full h-full", className)}
        {...props}
      >
        <div className="relative w-full h-full">
          <div
            className={`absolute translate-x-[-50%] translate-y-[-50%] w-3 h-3 border rounded`}
            style={{
              backgroundColor: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
              top: `${ry}%`,
              left: `${rx}%`,
            }}
          ></div>
        </div>
      </div>
    );
  };

  return (
    <Popover modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="flex h-9 w-9 items-center justify-center ring-offset-background data-[placeholder]:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1"
        >
          <div
            className="h-6 aspect-square rounded"
            style={{ backgroundColor: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` }}
          ></div>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end">
        <ColorPickerContent />
      </PopoverContent>
    </Popover>
  );
};

export { ColorPicker };
