"use client";

import { Fragment, useState } from "react";
import { usePathname } from "next/navigation";
import Header from "./header";
import { ScrollArea } from "@/components/ui/scroll-area";

const ClientLayout = ({
  children,
}: Readonly<{ children: React.ReactNode }>) => {
  const [reloadKey, setReloadKey] = useState(0);
  const pathname = usePathname();
  const triggerReload = () => {
    if (pathname == "/") {
      console.log(pathname);
      setReloadKey((prev) => prev + 1);
    }
  };

  return (
    <body className="flex flex-col h-screen">
      <Header onTriggerReload={triggerReload} />
      <ScrollArea className="flex-1 h-full">
        <main className="container mx-auto" key={`main_${reloadKey}`}>
          {children}
        </main>
      </ScrollArea>
    </body>
  );
};

export default ClientLayout;
