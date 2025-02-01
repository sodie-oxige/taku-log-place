"use client";

import { Fragment, useState } from "react";
import { usePathname } from "next/navigation";
import Header from "./header";

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
    <Fragment>
      <Header onTriggerReload={triggerReload} />
      <main className="container mx-auto p-2 pt-14 min-h-screen" key={`main_${reloadKey}`}>
        {children}
      </main>
    </Fragment>
  );
};

export default ClientLayout;
