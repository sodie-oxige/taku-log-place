export {};

declare global {
  interface Window {
    dom: {
      main: ReactNode;
    };
    
    electron: {
      windowClose: () => void;
      windowMaximize: () => void;
      windowMinimize: () => void;
      saveHtml: (id: string) => void;
      // 監視ディレクトリ一覧操作
      logdirGet: () => string[];
      logdirAdd: () => Promise<string[]>;
      logdirDelete: (id: string) => string[];
      // ログファイル一覧操作
      logfilesGet: () => TlogfileMetadata[];
      logfileSet: (data: TlogTableColumn) => void;
      // ログファイル操作
      logdataGet: (id: string) => TlogfileData;
      logdataSet: (
        id: string,
        data: { name: string; tabtype: number; color: string }
      ) => void;
      // ブックマーク操作
      bookmarkGet: (id: string) => number[];
      bookmarkSet: (id: string, index: number) => void;
    };
    pluginAPI: {
      loadPluginScripts: () => Promise<{ name: string; data: string }[]>;
    };
  }

  // アプリ全体の設定
  interface Tsetting {
    logdir: string[];
  }

  // htmlファイル毎の設定（Record<path,TlogfileSetting>でフォルダごとに保存）
  interface TlogfileSetting {
    ver: [number, number, number];
    cols: Record<string, TlogfileMetadata>;
  }

  // 一覧表示に使うデータ
  interface TlogfileMetadata {
    name: string;
    path: string;
    date: number;
    tag: string[];
    tabs: Record<
      string,
      {
        tabtype: number;
        tabcolor?: string;
      }
    >;
    bookmark?: number;
  }

  // 閲覧ファイル読み込みデータ
  interface TlogfileData {
    metadata: TlogfileMetadata;
    colmuns: TlogcolumnData[];
  }

  // 各発言データ
  interface TlogcolumnData {
    name: string;
    tab: string;
    content: string;
    color: string;
  }
}
