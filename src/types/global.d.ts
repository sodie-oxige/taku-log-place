export {};

declare global {
  interface Window {
    electron: {
      windowClose: () => void;
      windowMaximize: () => void;
      windowMinimize: () => void;
      logdirAdd: () => Promise<string[] | null>;
      logdirGet: () => Promise<string[] | null>;
      logfileGet: () => Promise<TlogTableColumn[]>;
      logdataGet: () => Promise<Tlogdata[]>;
    };
  }

  interface Tsetting {
    logdir: string[];
  }

  interface TlogTableColumn {
    name: string;
    path: string;
    date: number;
    tag: string[];
  }

  interface Tlogdata {
    name: string;
    tab: string;
    content: string;
    color: string;
  }
}
