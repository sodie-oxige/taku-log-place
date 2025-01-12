import { app, BrowserWindow, dialog, ipcMain } from "electron";
import path from "path";
import JsonManage from "./module/json_manager";
import fs from "fs";

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

  mainWindow.loadURL("http://localhost:3000");

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

ipcMain.handle("logdir:add", async () => {
  const result = (await dialog.showOpenDialog({
    properties: ["openDirectory"],
    // title: "ファイルを選択する",
  })) as unknown as Electron.OpenDialogReturnValue;

  let setting: Tsetting = await JsonManage.get("setting");
  if (!result.canceled) {
    setting.logdir.push(result.filePaths[0]);
    JsonManage.update<Tsetting>("setting", setting);
  }
  return setting.logdir;
});

ipcMain.handle("logdir:get", async () => {
  const setting: Tsetting = await JsonManage.get("setting");
  return setting.logdir;
});

ipcMain.handle("logfile:get", async () => {
  const setting: Tsetting = await JsonManage.get("setting");
  const logfiles: string[] = setting.logdir
    .map((d) => readDirSyncSub(d))
    .flat()
    .filter((p) => /\.html?$/.test(p));
  const res: TlogTableColumn[] = logfiles.map((l) => {
    const splittedPath = l.split("\\");
    return {
      name: splittedPath[splittedPath.length - 1],
      path: l,
      date: 0,
      tag: [],
    };
  });
  return res;
});

ipcMain.handle("logdata:get", async (_event, id: string) => {
  const res: Tlogdata[] = [];
  const filepath = decodeURIComponent(id);
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
