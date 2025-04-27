"use client";

import { Separator } from "@/components/ui/separator";
import {
  Fragment,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";

const Tabtypes = ["その他", "メイン", "雑談", "情報", "カラー"];

const logfileDataDefault: TlogfileData = {
  metadata: {
    name: "",
    path: "",
    date: 0,
    tag: [],
    tabs: {},
  },
  colmuns: [],
};
const DetailPageComponent = () => {
  const [colSetting, setColSetting] = useState<TlogfileData["colmuns"]>(
    logfileDataDefault["colmuns"]
  );
  const [tabSetting, setTabSetting] = useState<
    TlogfileData["metadata"]["tabs"]
  >(logfileDataDefault["metadata"]["tabs"]);
  const isLogdataLoaded = useRef(false); // logdataのロードが完了したかのフラグ
  const deffTabSetting = useRef<TlogfileData["metadata"]["tabs"]>({}); // tabSettingの変更箇所
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const pageName = useRef("");

  useEffect(() => {
    (async () => {
      const res = await window.electron.logdataGet(id);
      setColSetting(res.colmuns);
      setTabSetting(res.metadata.tabs);
      isLogdataLoaded.current = true;
      pageName.current = res.metadata.name;
      window.electron.saveHtml(pageName.current);
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
      deffTabSetting.current[name] = {
        tabtype: Number(index),
        tabcolor: undefined,
      };
      const data = {
        name: name,
        tabtype: Number(index),
        color: false,
      };
      window.electron.logdataSet(id, data);
    };
    const onColorChange = (c: { h: number; s: number; l: number }) => {
      deffTabSetting.current[name] = {
        tabtype: tabtype,
        tabcolor: ColorUtils.hsl2code(c),
      };
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
          {tabtype == 4 && (
            <ColorPicker
              onChange={onColorChange}
              value={
                v.tabcolor
                  ? ColorUtils.code2hsl(v.tabcolor as ColorUtils.Code)
                  : { h: 0, s: 100, l: 98 }
              }
            />
          )}
        </div>
      </>
    );
  };

  const Statement = ({ statement }: { statement: TlogcolumnData }) => {
    const props = {
      author: statement.name,
      content: statement.content,
      tab: statement.tab,
    };
    if (statement.name == "system")
      return <SystemStatement statement={statement} {...props} />;
    switch (tabSetting[statement.tab]?.tabtype) {
      case 0:
        return <AnotherStatement statement={statement} {...props} />;
      case 1:
        return <MainStatement statement={statement} {...props} />;
      case 2:
        return <OtherStatement statement={statement} {...props} />;
      case 3:
        return <InfoStatement statement={statement} {...props} />;
      case 4:
        return (
          <ColorStatement
            statement={statement}
            bg={tabSetting[statement.tab]?.tabcolor ?? "#fff3f3"}
            {...props}
          />
        );
      default:
        return <AnotherStatement statement={statement} {...props} />;
    }
  };

  const onOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      deffTabSetting.current = {};
    } else {
      let isChanged = false;
      const newTabSetting = { ...tabSetting };
      Object.keys(deffTabSetting.current).forEach((name) => {
        const data = deffTabSetting.current[name];
        if (
          !tabSetting[name] ||
          tabSetting[name].tabtype != data.tabtype ||
          tabSetting[name].tabcolor != data.tabcolor
        ) {
          isChanged = true;
          if (!newTabSetting[name]) newTabSetting[name] = { tabtype: 0 };
          newTabSetting[name].tabtype = data.tabtype;
          if (data.tabcolor) newTabSetting[name].tabcolor = data.tabcolor;
        }
      });
      if (isChanged) {
        setTabSetting(newTabSetting);
        window.electron.saveHtml(pageName.current);
      }
    }
  };
  const sortedTabs = useMemo(
    () =>
      Object.entries(tabSetting).sort(([ak, _av], [bk, _bv]) => {
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
      }),
    [tabSetting]
  );

  return (
    <div>
      <Sheet onOpenChange={onOpenChange}>
        <SheetTrigger className="fixed top-14 right-4" asChild>
          <Button variant="outline" size="icon">
            <ChevronRight />
          </Button>
        </SheetTrigger>
        <SheetContent className="p-0">
          <ScrollArea className="h-full">
            <SheetHeader className="p-6">
              <SheetTitle>タブ設定</SheetTitle>
              {!!tabSetting &&
                sortedTabs.map(([k, v]) => {
                  return (
                    <Tabselect name={k} value={v} key={`tabselect_${k}`} />
                  );
                })}
            </SheetHeader>
          </ScrollArea>
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
        : colSetting.map((l, i) => (
            <Fragment key={i}>
              <Statement statement={l} />
              <Separator />
            </Fragment>
          ))}
    </div>
  );
};

const MainStatement = ({
  statement,
  ...props
}: {
  statement: TlogcolumnData;
}) => {
  return (
    <div
      className="flex flex-col p-2.5"
      style={
        {
          "--c": statement.color,
        } as React.CSSProperties
      }
      {...props}
    >
      <span className="text-2xs font-bold text-[var(--c)]">
        {statement.name}
      </span>
      <p className="mt-1 ml-2 text-lg">
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

const OtherStatement = ({
  statement,
  ...props
}: {
  statement: TlogcolumnData;
}) => {
  return (
    <div
      className="ml-6 flex flex-col p-2.5 text-[var(--c)]"
      style={
        {
          "--c": statement.color,
        } as React.CSSProperties
      }
      {...props}
    >
      <span className="text-2xs font-bold">{statement.name}</span>
      <p className="ml-2 text-sm">
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

const ColorStatement = ({
  statement,
  bg,
  ...props
}: {
  statement: TlogcolumnData;
  bg: string;
}) => {
  return (
    <div
      className="ml-6 flex flex-col p-2.5 text-[var(--c)]"
      style={
        {
          "--c": statement.color,
          backgroundColor: bg,
        } as React.CSSProperties
      }
      {...props}
    >
      <span className="text-2xs font-bold">
        {statement.name} [{statement.tab}]
      </span>
      <p className="ml-2 text-sm">
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

const SystemStatement = ({
  statement,
  ...props
}: {
  statement: TlogcolumnData;
}) => {
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
    <div className="flex flex-col items-center p-2.5" {...props}>
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

const InfoStatement = ({
  statement,
  ...props
}: {
  statement: TlogcolumnData;
}) => {
  return (
    <div
      className="m-1 mx-auto flex flex-col px-2 min-w-[80%] w-[100vh] max-w-full border-x"
      style={
        {
          "--c": statement.color,
        } as React.CSSProperties
      }
      {...props}
    >
      <span className="text-2xs font-bold text-[var(--c)]">
        {statement.name}
      </span>
      <p className="ml-2 p-2 text-lg">
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

const AnotherStatement = ({
  statement,
  ...props
}: {
  statement: TlogcolumnData;
}) => {
  return (
    <div
      className="ml-6 flex flex-col p-2.5"
      style={
        {
          "--c": statement.color,
        } as React.CSSProperties
      }
      {...props}
    >
      <p className="text-2xs font-bold text-[var(--c)]">
        {statement.name} [{statement.tab}]
      </p>
      <p className="ml-2 text-sm">
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
