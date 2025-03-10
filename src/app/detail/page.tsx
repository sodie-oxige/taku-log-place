"use client";

import { Separator } from "@/components/ui/separator";
import { Fragment, Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ChevronRight } from "lucide-react";
import { ColorPicker } from "@/components/colorpicker";
import { ColorUtils } from "@root/module/color_utils";

const logfileDataDefault: TlogfileData = {
  tabs: {},
  colmuns: [],
};
const Tabtypes = ["その他", "メイン", "雑談", "情報", "システム", "カラー"];

const DetailPageComponent = () => {
  const [logdata, setLogdata] = useState<TlogfileData>(logfileDataDefault);
  const isLogdataLoaded = useRef(false); // logdataのロードが完了したかのフラグ
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  useEffect(() => {
    (async () => {
      const res = await window.electron.logdataGet(id);
      setLogdata(res);
      isLogdataLoaded.current = true;
    })();
  }, [searchParams]);

  const Tabselect = ({
    name,
    value: v,
  }: {
    name: string;
    value: { tabtype: number; tabcolor?: string };
  }) => {
    const [tabtype, settabtype] = useState<number>(v.tabtype);

    const onValueChange = (index: string) => {
      settabtype(Number(index));
      const data = {
        name: name,
        tabtype: Number(index),
        color: false,
      };
      window.electron.logdataSet(id, data);
    };
    const onColorChange = (c: { h: number; s: number; l: number }) => {
      const data = {
        name: name,
        tabtype: tabtype,
        color: ColorUtils.hsl2code(c),
      };
      window.electron.logdataSet(id, data);
    };

    return (
      <>
        <Label>{name}</Label>
        <div className="flex mb-2 gap-1">
          <Select value={tabtype.toString()} onValueChange={onValueChange}>
            <SelectTrigger className="flex-1 w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Tabtypes.map((v, i) => {
                return (
                  <SelectItem value={i.toString()} key={`${name}_${i}`}>
                    {v}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          {v.tabtype == 5 && (
            <ColorPicker
              onChange={onColorChange}
              value={
                v.tabcolor
                  ? ColorUtils.code2hsl(v.tabcolor as ColorUtils.Code)
                  : undefined
              }
            />
          )}
        </div>
      </>
    );
  };

  const Statement = ({ statement }: { statement: TlogcolumnData }) => {
    if (statement.name == "system")
      return <SystemStatement statement={statement} />;
    switch (logdata.tabs[statement.tab]?.tabtype) {
      case 0:
        return <AnotherStatement statement={statement} />;
      case 1:
        return <MainStatement statement={statement} />;
      case 2:
        return <OtherStatement statement={statement} />;
      case 3:
        return <InfoStatement statement={statement} />;
      default:
        return <AnotherStatement statement={statement} />;
    }
  };

  return (
    <div>
      <Sheet>
        <SheetTrigger className="fixed top-14 right-2" asChild>
          <Button variant="outline" size="icon">
            <ChevronRight />
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>タブ設定</SheetTitle>
            {!!logdata.tabs &&
              Object.entries(logdata.tabs)
                .sort(([ak, _av], [bk, _bv]) => {
                  const a =
                    ak == "main" || ak == "メイン"
                      ? 3
                      : ak == "other" || ak == "雑談"
                      ? 2
                      : ak == "info" || ak == "情報"
                      ? 1
                      : 0;
                  const b =
                    bk == "main" || bk == "メイン"
                      ? 3
                      : bk == "other" || bk == "雑談"
                      ? 2
                      : bk == "info" || bk == "情報"
                      ? 1
                      : 0;
                  return b - a;
                })
                .map(([k, v]) => {
                  return (
                    <Tabselect name={k} value={v} key={`tabselect_${k}`} />
                  );
                })}
          </SheetHeader>
        </SheetContent>
      </Sheet>

      {!isLogdataLoaded.current
        ? [...Array(10)].map((_, i) => (
            <Fragment key={i}>
              <div className="flex flex-col gap-1 p-2">
                <Skeleton className="my-1 h-3.5 w-40" />
                <Skeleton className="my-1 ml-2 h-4 w-full" />
              </div>
              <Separator />
            </Fragment>
          ))
        : logdata.colmuns.map((l, i) => (
            <Fragment key={i}>
              <Statement statement={l} />
              <Separator />
            </Fragment>
          ))}
    </div>
  );
};

const MainStatement = ({ statement }: { statement: TlogcolumnData }) => {
  return (
    <div
      className="flex flex-col p-2.5"
      style={
        {
          "--c": statement.color,
        } as React.CSSProperties
      }
    >
      <span className="text-sm font-bold text-[var(--c)]">
        {statement.name}
      </span>
      <p className="ml-1">
        {statement.content.split("\n").map((line, index) => (
          <Fragment key={index}>
            {line}
            <br />
          </Fragment>
        ))}
      </p>
    </div>
  );
};

const OtherStatement = ({ statement }: { statement: TlogcolumnData }) => {
  return (
    <div
      className="ml-6 flex flex-col p-2.5 text-[var(--c)]"
      style={
        {
          "--c": statement.color,
        } as React.CSSProperties
      }
    >
      <span className="text-xs font-bold">{statement.name}</span>
      <p className="text-xs">
        {statement.content.split("\n").map((line, index) => (
          <Fragment key={index}>
            {line}
            <br />
          </Fragment>
        ))}
      </p>
    </div>
  );
};

const SystemStatement = ({ statement }: { statement: TlogcolumnData }) => {
  const temp: string[] = statement.content
    .split(/[\[\]\:→]/)
    .map((v) => v.trim())
    .filter((v) => v);
  const data = {
    name: temp[0],
    tab: temp[1],
    before: temp[2],
    after: temp[3],
  };
  return (
    <div className="flex flex-col items-center p-2.5">
      <p className="relative text-xs font-bold">
        <span className="absolute mr-2 right-[50%] whitespace-nowrap">
          {data.name}
        </span>
        :
        <span className="absolute ml-2 left-[50%] whitespace-nowrap">
          {data.tab}
        </span>
      </p>
      <p className="relative w-fit  font-mono font-bold oldstyle-nums">
        <span className="absolute mr-4 bottom-0 right-[50%] whitespace-nowrap">
          {data.before}
        </span>
        &gt;&gt;
        <span className="text-lg absolute ml-4 bottom-0 left-[50%] whitespace-nowrap">
          {data.after}
        </span>
      </p>
    </div>
  );
};

const InfoStatement = ({ statement }: { statement: TlogcolumnData }) => {
  return (
    <div
      className="m-1 mx-16 flex flex-col px-2 border-x"
      style={
        {
          "--c": statement.color,
        } as React.CSSProperties
      }
    >
      <span className="text-xs font-bold text-[var(--c)]">
        {statement.name}
      </span>
      <p className="ml-2 p-2">
        {statement.content.split("\n").map((line, index) => (
          <Fragment key={index}>
            {line}
            <br />
          </Fragment>
        ))}
      </p>
    </div>
  );
};

const AnotherStatement = ({ statement }: { statement: TlogcolumnData }) => {
  return (
    <div
      className="ml-6 flex flex-col p-2.5"
      style={
        {
          "--c": statement.color,
        } as React.CSSProperties
      }
    >
      <p className="text-sm font-bold text-[var(--c)]">
        {statement.name} <span className="text-xs">[{statement.tab}]</span>
      </p>
      <p>
        {statement.content.split("\n").map((line, index) => (
          <Fragment key={index}>
            {line}
            <br />
          </Fragment>
        ))}
      </p>
    </div>
  );
};

const DetailPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DetailPageComponent />
    </Suspense>
  );
};

export default DetailPage;
