import fs from "fs";

class JsonManage {
  private static setting: Record<
    string,
    { name: string; path: string; data: any }
  > = {};

  public static init<T>(name: string, path: string, defaultData: T) {
    console.log(path)
    console.log(fs.existsSync(path))
    console.log(defaultData)
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

  public static clear(): void {
    for (const name in JsonManage.setting) JsonManage.delete(name);
    JsonManage.setting = {};
  }

  public static async get<T>(name: string): Promise<T> {
    if (name in JsonManage.setting) {
      return JsonManage.setting[name].data as T;
    } else {
      throw new Error(`Data with name "${name}" is not initialized.`);
    }
  }

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

  public static delete(name: string): void {
    if (name in JsonManage.setting) {
      delete JsonManage.setting[name];
      fs.unlinkSync(JsonManage.setting[name].path);
    } else {
      throw new Error(`Data with name "${name}" does not exist.`);
    }
  }
}

export default JsonManage;
