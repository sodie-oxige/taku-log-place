"use client";

import { Separator } from "@/components/ui/separator";
import { Fragment, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const DetailPageComponent = () => {
  const [logdata, setLogdata] = useState([] as Tlogdata[]);
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  useEffect(() => {
    (async () => {
      const res = await window.electron.logdataGet(id);
      setLogdata(res);
    })();
  }, [searchParams]);

  return (
    <div>
      {logdata.map((l, i) => (
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

const DetailPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DetailPageComponent />
    </Suspense>
  );
};

export default DetailPage;
