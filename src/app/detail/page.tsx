"use client";

import { Separator } from "@/components/ui/separator";
import { Fragment, Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

const DetailPage = () => {
  const [logdata, setLogdata] = useState<Tlogdata[]>([]);
  const isLogdataLoaded = useRef(false); // logdataのロードが完了したかのフラグ
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  useEffect(() => {
    (async () => {
      console.log(id);
      const res = await window.electron.logdataGet(id);
      setLogdata(res);
      isLogdataLoaded.current = true;
    })();
  }, [searchParams]);

  return (
    <div>
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
        : logdata.map((l, i) => (
            <Fragment key={i}>
              <div
                className="flex flex-col gap-1 p-2"
                style={
                  {
                    "--c": l.color,
                  } as React.CSSProperties
                }
              >
                <p className="text-sm font-bold text-[var(--c)]">
                  {l.name} <span className="text-xs">[{l.tab}]</span>
                </p>
                <p className="pl-2">
                  {l.content.split("\n").map((line, index) => (
                    <Fragment key={index}>
                      {line}
                      <br />
                    </Fragment>
                  ))}
                </p>
              </div>
              <Separator />
            </Fragment>
          ))}
    </div>
  );
};

export default DetailPage;
