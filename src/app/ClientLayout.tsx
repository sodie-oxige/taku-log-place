"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Header from "./header";

const ClientLayout = ({
  children,
}: Readonly<{ children: React.ReactNode }>) => {
  const [reloadKey, setReloadKey] = useState(0);
  const pathname = usePathname();
  const triggerReload = () => {
    if (pathname == "/") {
      setReloadKey((prev) => prev + 1);
    }
  };

  return (
    <body className="flex flex-col h-screen">
      <Header onTriggerReload={triggerReload} />
      <div className="flex-1 h-full overflow-y-auto scrollbar">
        <main className="container mx-auto px-4 w-[100dvw]" key={`main_${reloadKey}`}>
          {children}
        </main>
      </div>
    </body>
  );
};

export default ClientLayout;
