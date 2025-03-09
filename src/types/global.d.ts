export {};

declare global {
  interface Window {
    electron: {
      windowClose: () => void;
      windowMaximize: () => void;
      windowMinimize: () => void;
      // 監視ディレクトリ一覧操作
      logdirGet: () => string[];
      logdirAdd: () => Promise<string[]>;
      logdirDelete: (string) => string[];
      // ログファイル一覧操作
      logfilesGet: () => TlogfileMetadata[];
      logfileSet: (TlogTableColumn) => void;
      // ログファイル操作
      logdataGet: (string) => TlogfileData;
      logdataSet: (
        string,
        { name: string, tabtype: number, color: string }
      ) => void;
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
