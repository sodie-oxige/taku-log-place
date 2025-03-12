import { app, BrowserWindow, dialog, ipcMain } from "electron";
import path from "path";
import JsonManage from "./module/json_manager";
import fs from "fs";
import { Parser } from "htmlparser2";

let defaultSetting: Tsetting = {
  logdir: [],
};
function defaultTabtype(tab: string): number {
  switch (tab) {
    case "main":
      return 1;
    case "メイン":
      return 1;
    case "other":
      return 2;
    case "雑談":
      return 2;
    case "info":
      return 3;
    case "情報":
      return 3;
    default:
      return 0;
  }
}

let mainWindow: BrowserWindow | null;
const version: [number, number, number] = process.env.npm_package_version
  ?.split(".")
  .map((n) => Number(n))
  .concat([0, 0, 0])
  .slice(0, 3) as [number, number, number];

app.on("ready", () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
    },
  });

  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL("http://localhost:3000");
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "out", "index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  const settingPath = path.join(app.getPath("userData"), "setting.json");
  JsonManage.init("setting", settingPath, defaultSetting);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("window-close", () => {
  app.quit();
});

ipcMain.handle("window-maximize", () => {
  if (mainWindow == null) return;
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.handle("window-minimize", () => {
  if (mainWindow == null) return;
  mainWindow.minimize();
});

ipcMain.handle("logdir:get", () => {
  const setting: Tsetting = JsonManage.get("setting");
  return setting.logdir;
});

ipcMain.handle("logdir:add", async () => {
  const result = (await dialog.showOpenDialog({
    properties: ["openDirectory"],
    title: "ファイルを選択する",
  })) as unknown as Electron.OpenDialogReturnValue;

  let setting: Tsetting = JsonManage.get("setting");
  if (!result.canceled) {
    setting.logdir.push(result.filePaths[0]);
    JsonManage.update<Tsetting>("setting", setting);
  }
  return setting.logdir;
});

ipcMain.handle("logdir:delete", (_event, deleteDir: string) => {
  let setting: Tsetting = JsonManage.get("setting");
  setting.logdir = setting.logdir.filter((d) => d != deleteDir);
  JsonManage.update<Tsetting>("setting", setting);
  return setting.logdir;
});

ipcMain.handle("logfiles:get", () => {
  const setting: Tsetting = JsonManage.getFresh("setting");
  const logfiles: string[] = setting.logdir
    .map((d) => fs.readdirSync(d).map((f) => path.join(d, f)))
    .flat()
    .filter((p) => /\.html?$/.test(p));
  const res: TlogfileMetadata[] = logfiles.map((l) => {
    const dirPath = path.dirname(l);
    const fileName = path.basename(l);
    const jsonName = dirPath;
    const jsonPath = path.resolve(dirPath, "modifier.json");
    if (!JsonManage.isDefined(jsonName))
      JsonManage.init(jsonName, jsonPath, {});
    const data: TlogfileMetadata = getModifier(JsonManage.get(jsonName)).cols[
      fileName
    ];
    return {
      name: data?.name || fileName,
      path: l,
      date: data?.date || 0,
      tag: data?.tag || [],
      tabs: {},
    };
  });
  return res;
});

ipcMain.handle("logfile:set", (_event, data: TlogfileMetadata) => {
  const dirPath = path.dirname(data.path);
  const fileaName = path.basename(data.path);
  const jsonName = dirPath;
  const jsonPath = path.resolve(dirPath, "modifier.json");
  if (!JsonManage.isDefined(jsonName)) JsonManage.init(jsonName, jsonPath, {});
  let modifierJson: TlogfileSetting = getModifier(JsonManage.get(jsonName));
  modifierJson.cols[fileaName] = data;
  JsonManage.update(jsonName, modifierJson);
});

ipcMain.handle("logdata:get", (_event, id: string) => {
  const filepath = decodeURIComponent(id);
  const _temp = filepath.split("\\");
  const fileName = _temp.pop() as string;
  const dirPath = _temp.join("\\");
  const jsonPath = path.resolve(dirPath, "modifier.json");
  if (!JsonManage.isDefined(dirPath))
    JsonManage.init(dirPath, jsonPath, {
      ver: version,
      tabs: {},
      cols: {},
    } as TlogfileSetting);
  let modifierJson: TlogfileSetting = getModifier(JsonManage.get(dirPath));
  const res: TlogfileData = {
    tabs: {},
    colmuns: [],
  };
  const defaultLogdata: TlogcolumnData = {
    name: "",
    tab: "",
    content: "",
    color: "",
  };
  let currentLogdata: TlogcolumnData = { ...defaultLogdata };
  let isSpan = false;
  let spanIndex = 0;

  const parser = new Parser({
    onopentag(name, attr) {
      if (name === "p") {
        currentLogdata = { ...defaultLogdata };
        const color = attr.style.match(/#[0-9a-f]{6}/);
        if (color !== null) currentLogdata.color += color[0];
      } else if (name === "span") {
        isSpan = true;
        spanIndex++;
      } else if (spanIndex === 3 && name === "br") {
        currentLogdata.content += "\n";
      }
    },
    ontext(text) {
      if (!isSpan) return;
      switch (spanIndex) {
        case 1:
          currentLogdata.tab += text.replace(/[\[\]]/g, "");
          break;
        case 2:
          currentLogdata.name += text;
          break;
        case 3:
          currentLogdata.content += text;
          break;
      }
    },
    onclosetag(name) {
      if (name === "p") {
        currentLogdata.name = currentLogdata.name.trim();
        currentLogdata.tab = currentLogdata.tab.trim();
        currentLogdata.content = currentLogdata.content.trim();
        res.colmuns.push(currentLogdata);
        if (!(currentLogdata.tab in res.tabs)) {
          res.tabs[currentLogdata.tab] = {
            tabtype:
              modifierJson?.cols?.[fileName]?.tabs?.[currentLogdata.tab]
                ?.tabtype ?? defaultTabtype(currentLogdata.tab),
            tabcolor:
              modifierJson?.cols?.[fileName]?.tabs?.[currentLogdata.tab]
                ?.tabcolor,
          };
        }
        spanIndex = 0;
      } else if (name === "span") {
        isSpan = false;
      }
    },
  });

  const html = fs.readFileSync(filepath, "utf-8");
  parser.write(html);
  parser.end();

  return res;
});

ipcMain.handle(
  "logdata:set",
  (
    _event,
    id: string,
    data: { name: string; tabtype: number; color?: string }
  ) => {
    const filepath = decodeURIComponent(id);
    const _temp = filepath.split("\\");
    const fileName = _temp.pop();
    const dirPath = _temp.join("\\");
    const jsonPath = path.resolve(dirPath, "modifier.json");

    if (!fileName) return;
    if (!JsonManage.isDefined(dirPath))
      JsonManage.init(dirPath, jsonPath, {
        ver: version,
        tabs: {},
        cols: {},
      } as TlogfileSetting);
    const json = getModifier(JsonManage.get(dirPath));
    if (!json.cols[fileName])
      json.cols[fileName] = {
        name: fileName,
        path: filepath,
        date: 0,
        tag: [],
        tabs: {},
      };
    if (!json.cols[fileName].tabs) json.cols[fileName].tabs = {};
    if (!json.cols[fileName].tabs[data.name])
      json.cols[fileName].tabs[data.name] = {
        tabtype: 0,
        tabcolor: "#fff3f3",
      };
    json.cols[fileName].tabs[data.name].tabtype = data.tabtype;
    if (data.color) json.cols[fileName].tabs[data.name].tabcolor = data.color;
    JsonManage.update(dirPath, json);
    return;
  }
);

const compareVersion = (
  version: [number, number, number],
  sourceVersion: [number, number, number]
): boolean => {
  if (version[0] > sourceVersion[0]) return true;
  if (version[1] > sourceVersion[1]) return true;
  if (version[2] >= sourceVersion[2]) return true;
  return false;
};
const getModifier = (data: any): TlogfileSetting => {
  const def: TlogfileSetting = {
    ver: [0, 0, 0],
    cols: {},
  };
  let res = def;
  if (!("ver" in data)) {
    //v1.2.0以前
    res["cols"] = data;
    // } else if (!compareVersion(data["ver"], [9, 9, 9])) {
  } else {
    res = data;
  }
  res.ver = version;
  return res;
};
