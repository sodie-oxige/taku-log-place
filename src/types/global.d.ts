export {};

declare global {
  interface Window {
    electron: {
      windowClose: () => void;
      windowMaximize: () => void;
      windowMinimize: () => void;
      saveHtml: (string) => void;
      logdirGet: () => string[];
      logdirAdd: () => Promise<string[]>;
      logdirDelete: (string) => string[];
      logfilesGet: () => TlogfileMetadata[];
      logfileSet: (TlogTableColumn) => void;
      logdataGet: (string) => TlogfileData;
    };
  }

  interface Tsetting {
    logdir: string[];
  }

  interface TlogfileMetadata {
    name: string;
    path: string;
    date: number;
    tag: string[];
  }

  interface TlogfileData {
    metadata: TlogfileMetadata;
    colmuns: TlogcolumnData[];
  }

  interface TlogcolumnData {
    name: string;
    tab: string;
    content: string;
    color: string;
  }
}
