export {};

declare global {
  interface Window {
    electron: {
      windowClose: () => void;
      windowMaximize: () => void;
      windowMinimize: () => void;
      logdirAdd: () => string[] | null;
      logdirGet: () => string[] | null;
      logfileGet: () => TlogTableColumn[];
      logdataGet: (string) => Tlogdata[];
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
