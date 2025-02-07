import fs from "fs";

/**
 * jsonファイルの読み書きを簡潔にするモジュール
 */
class JsonManage {
  private static setting: Record<
    string,
    { name: string; path: string; data: any }
  > = {};

  /**
   * jsonファイルのモジュールへの読み込みを行う。
   * 以降は再度reloadしない限り、外部からファイルが書き換わっても変更は反映されない。
   * @param name JsonManagerからアクセスするための固有名
   * @param path jsonファイルの保存パス
   * @param defaultData ファイルがない場合の初期値
   */
  public static init<T>(name: string, path: string, defaultData: T) {
    if (!fs.existsSync(path)) {
      fs.writeFileSync(path, JSON.stringify(defaultData, null, 2));
    }
    if (!(name in JsonManage.setting)) {
      JsonManage.setting[name] = {
        name: name,
        path: path,
        data: defaultData,
      };
    }
    const data = fs.readFileSync(path, "utf-8");
    JsonManage.setting[name].data = JSON.parse(data);
  }

  /**
   * jsonファイルのモジュールへの再読み込みを行う。
   * @param name JsonManagerからアクセスするための固有名
   */
  public static reload(name: string) {
    const path = JsonManage.setting[name].path;
    const data = fs.readFileSync(path, "utf-8");
    JsonManage.setting[name].data = JSON.parse(data);
  }

  /**
   * 全てのデータをモジュール内から削除する。ファイルの削除を行うわけではない。
   */
  public static clear(): void {
    for (const name in JsonManage.setting) JsonManage.delete(name);
    JsonManage.setting = {};
  }

  /**
   * 固有名からjsonデータを取得する。
   * initされていないとエラーを返す。
   * @param name JsonManagerからアクセスするための固有名
   * @returns オブジェクト
   */
  public static get<T>(name: string): T {
    if (name in JsonManage.setting) {
      return JsonManage.setting[name].data as T;
    } else {
      throw new Error(`Data with name "${name}" is not initialized.`);
    }
  }

  /**
   * 固有名から、jsonファイルを再読み込みして最新のjsonデータを取得する。
   * initされていないとエラーを返す。
   * @param name JsonManagerからアクセスするための固有名
   * @returns オブジェクト
   */
  public static getFresh<T>(name: string): T {
    JsonManage.reload(name);
    return JsonManage.get<T>(name);
  }

  /**
   * データの上書きを行う。
   * initされていないとエラーを返す。
   * @param name JsonManagerからアクセスするための固有名
   * @param data 上書き用データ
   */
  public static update<T>(name: string, data: T): void {
    if (name in JsonManage.setting) {
      JsonManage.setting[name].data = data;
      fs.writeFileSync(
        JsonManage.setting[name].path,
        JSON.stringify(data, null, 2)
      );
    } else {
      throw new Error(`Data with name "${name}" is not initialized.`);
    }
  }

  /**
   * データの削除を行う。
   * clearと違いこちらは固有名からの単体削除。
   * @param name JsonManagerからアクセスするための固有名
   */
  public static delete(name: string): void {
    if (name in JsonManage.setting) {
      delete JsonManage.setting[name];
      fs.unlinkSync(JsonManage.setting[name].path);
    } else {
      throw new Error(`Data with name "${name}" does not exist.`);
    }
  }

  /**
   * initされているかの確認。
   * @param name JsonManagerからアクセスするための固有名
   * @returns initされているか（boolean）
   */
  public static isDefined(name: string): boolean {
    return name in JsonManage.setting;
  }
}

export default JsonManage;
