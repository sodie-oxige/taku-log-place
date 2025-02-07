import { app, BrowserWindow, dialog, ipcMain } from "electron";
import path from "path";
import JsonManage from "./module/json_manager";
import fs from "fs";
import { Parser } from "htmlparser2";

let defaultSetting: Tsetting = {
  logdir: [],
};

let mainWindow: BrowserWindow | null;

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
  const res: TlogTableColumn[] = logfiles.map((l) => {
    const dirPath = path.dirname(l);
    const fileName = path.basename(l);
    const jsonName = dirPath;
    const jsonPath = path.resolve(dirPath, "modifier.json");
    if (!JsonManage.isDefined(jsonName))
      JsonManage.init(jsonName, jsonPath, {});
    const data: TlogTableColumn = (
      JsonManage.get(jsonName) as Record<string, TlogTableColumn>
    )[fileName];
    return {
      name: data?.name || fileName,
      path: l,
      date: data?.date || 0,
      tag: data?.tag || [],
    };
  });
  return res;
});

ipcMain.handle("logfile:set", (_event, data: TlogTableColumn) => {
  const dirPath = path.dirname(data.path);
  const fileaName = path.basename(data.path);
  const jsonName = dirPath;
  const jsonPath = path.resolve(dirPath, "modifier.json");
  if (!JsonManage.isDefined(jsonName)) JsonManage.init(jsonName, jsonPath, {});
  let modifierJson: Record<string, TlogTableColumn> = JsonManage.get(jsonName);
  modifierJson[fileaName] = data;
  JsonManage.update(jsonName, modifierJson);
});

ipcMain.handle("logdata:get", (_event, id: string) => {
  const res: Tlogdata[] = [];
  const defaultLogdata: Tlogdata = {
    name: "",
    tab: "",
    content: "",
    color: "",
  };
  let currentLogdata: Tlogdata = { ...defaultLogdata };
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
        res.push(currentLogdata);
        spanIndex = 0;
      } else if (name === "span") {
        isSpan = false;
      }
    },
  });

  const filepath = decodeURIComponent(id);
  const html = fs.readFileSync(filepath, "utf-8");
  parser.write(html);
  parser.end();

  return res;
});

const readDirSyncSub = (dir: string): string[] => {
  let res: (string | string[])[] = fs
    .readdirSync(dir)
    .map((item) => path.join(dir, item));
  res.forEach((item, index) => {
    if (typeof item === "string") {
      if (fs.statSync(item as string).isDirectory()) {
        res[index] = readDirSyncSub(item as string);
      }
    }
  });
  return ([] as string[]).concat(...res);
};
