"use client";

import { Button } from "@/components/ui/button";
import { Cog, Shrink, Maximize, X } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "LogManager",
};

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
  return (
    <header className="fixed t-0 l-0 z-50 flex justify-center items-center w-screen px-2 h-12 bg-background shadow-md">
      <Button variant="outline">
        <Cog />
      </Button>
      <div className="flex-1">
        <Button
          variant="ghost"
          className="absolute top-[50%] left-[50%] [translate:-50%_-50%]"
          asChild
        >
          <Link href="/">
            <h1 className="text-lg font-bold">Log manager</h1>
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
