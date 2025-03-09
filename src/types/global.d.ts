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
      logfilesGet: () => TlogfileMetadata[];
      logfileSet: (TlogTableColumn) => void;
      logdataGet: (string) => TlogfileData;
    };
  }

  // アプリ全体の設定
  interface Tsetting {
    logdir: string[];
  }

  // htmlファイル毎の設定（Record<path,TlogfileSetting>でフォルダごとに保存）
  interface TlogfileSetting {
    tabs: Record<
      string,
      {
        tabtype: number;
        tabcolor?: string;
      }[]
    >;
    cols: Record<string, TlogfileMetadata>;
  }

  // 一覧表示に使うデータ
  interface TlogfileMetadata {
    name: string;
    path: string;
    date: number;
    tag: string[];
  }

  // 閲覧ファイル読み込みデータ
  interface TlogfileData {
    tabs: Record<
      string,
      {
        tabtype: number;
        tabcolor?: string;
      }
    >;
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
