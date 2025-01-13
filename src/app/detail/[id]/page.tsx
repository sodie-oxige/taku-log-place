"use client";

import { Separator } from "@/components/ui/separator";
import { useParams } from "next/navigation";
import { Fragment, useEffect, useState } from "react";

const DetailPage = () => {
  const [logdata, setLogdata] = useState([] as Tlogdata[]);
  const params = useParams();
  useEffect(() => {
    (async () => {
      const id = params.id;
      const res = await window.electron.logdataGet(id);
      console.log(res);
      setLogdata(res);
    })();
  }, []);
  return (
    <div>
      {logdata.map((l, i) => (
        <>
          <div
            key={i}
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
        </>
      ))}
    </div>
  );
};

export default DetailPage;
