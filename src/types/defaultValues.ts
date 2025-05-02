export default class defaultValues {
  // アプリ全体の設定
  static defTsetting: Tsetting = {
    logdir: [],
  };

  // htmlファイル毎の設定（Record<path,TlogfileSetting>でフォルダごとに保存）
  static defTlogfileSetting: TlogfileSetting = {
    ver: [0, 0, 0],
    cols: {},
  };

  // 一覧表示に使うデータ
  static defTlogfileMetadata: TlogfileMetadata = {
    name: "",
    path: "",
    date: 0,
    tag: [],
    tabs: {},
    bookmark: undefined,
  };

  // 閲覧ファイル読み込みデータ
  static defTlogfileData: TlogfileData = {
    metadata: defaultValues.defTlogfileMetadata,
    colmuns: [],
  };

  // 各発言データ
  static defTlogcolumnData: TlogcolumnData = {
    name: "",
    tab: "",
    content: "",
    color: "",
  };
}
