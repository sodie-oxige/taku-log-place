export {};

declare global {
  interface Window {
    electron: {
      windowClose: () => void;
      windowMaximize: () => void;
      windowMinimize: () => void;
      logdirGet: () => string[];
      logdirAdd: () => Promise<string[]>;
      logdirDelete: (string) => string[];
      logfilesGet: () => TlogTableColumn[];
      logfileSet: (TlogTableColumn) => void;
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
