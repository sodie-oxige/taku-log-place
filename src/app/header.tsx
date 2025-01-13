"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Cog, Shrink, Maximize, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const winClose = () => {
  window.electron.windowClose();
};
const winMaximize = () => {
  window.electron.windowMaximize();
};
const winMinimize = () => {
  window.electron.windowMinimize();
};

const Header = () => {
  const [logdir, setLogdir] = useState<string[]>([]);
  useEffect(() => {
    (async () => {
      const logdir = await window.electron.logdirGet();
      if (logdir && logdir.length > 0) setLogdir(logdir);
    })();
  }, []);

  const addLogdir = async () => {
    const logdir = await window.electron.logdirAdd();
    if (logdir && logdir.length <= 0) setLogdir(logdir);
  };

  return (
    <header className="fixed t-0 l-0 z-50 flex justify-center items-center w-screen px-2 h-12 bg-background shadow-md">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <Cog />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="m-2">
          <DropdownMenuLabel className="text-lg font-bold">
            ログ監視フォルダ
          </DropdownMenuLabel>
          {logdir.map((l) => (
            <DropdownMenuLabel key={l}>{l}</DropdownMenuLabel>
          ))}
          <DropdownMenuLabel className="text-lg font-bold">
            <Button onClick={addLogdir}>追加</Button>
          </DropdownMenuLabel>
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="flex-1">
        <Button
          variant="ghost"
          className="absolute top-[50%] left-[50%] [translate:-50%_-50%]"
          asChild
        >
          <Link href="/">
            <h1 className="text-lg font-bold">卓ログ置き場</h1>
          </Link>
        </Button>
      </div>
      <div className="flex -space-x-px">
        <Button
          variant="outline"
          className="rounded-r-none"
          onClick={winMinimize}
        >
          <Shrink />
        </Button>
        <Button
          variant="outline"
          className="rounded-none"
          onClick={winMaximize}
        >
          <Maximize />
        </Button>
        <Button
          variant="destructive"
          className="rounded-l-none"
          onClick={winClose}
        >
          <X />
        </Button>
      </div>
    </header>
  );
};

export default Header;
