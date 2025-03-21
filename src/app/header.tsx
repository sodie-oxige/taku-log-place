"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Cog, Shrink, Maximize, X, Trash2 } from "lucide-react";
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

const Header = ({ onTriggerReload }: { onTriggerReload: () => void }) => {
  const [logdir, setLogdir] = useState<string[]>([]);
  useEffect(() => {
    (async () => {
      const logdir = await window.electron.logdirGet();
      if (logdir && logdir.length > 0) setLogdir(logdir);
    })();
  }, [logdir]);

  const addLogdir = async () => {
    const logdir = await window.electron.logdirAdd();
    setLogdir(logdir);
    onTriggerReload();
  };

  const deleteLogdir = async (dir: string) => {
    const logdir = await window.electron.logdirDelete(dir);
    setLogdir(logdir);
    onTriggerReload();
  };

  return (
    <header className="relative flex justify-center items-center w-screen px-2 h-12 bg-background shadow-md">
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
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            {logdir.length > 0 ? (
              logdir.map((l) => (
                <DropdownMenuLabel
                  key={l}
                  className="flex justify-between items-center gap-4"
                >
                  <span>{l}</span>
                  <Button variant={"ghost"} onClick={() => deleteLogdir(l)}>
                    <Trash2 className="text-red-500" />
                  </Button>
                </DropdownMenuLabel>
              ))
            ) : (
              <DropdownMenuLabel className="mx-4 text-sm text-gray-500">
                監視フォルダが設定されていません
              </DropdownMenuLabel>
            )}
          </DropdownMenuGroup>
          <DropdownMenuLabel className="text-lg font-bold">
            <Button variant={"outline"} className="w-full" onClick={addLogdir}>追加</Button>
          </DropdownMenuLabel>
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="flex-1">
        <Button
          variant="ghost"
          className="absolute top-[50%] left-[50%] [translate:-50%_-50%]"
          asChild
        >
          <Link href="./">
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
