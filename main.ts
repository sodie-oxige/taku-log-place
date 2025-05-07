import { app, BrowserWindow, dialog, ipcMain } from "electron";
import path from "path";
import JsonManage from "./module/json_manager";
import fs from "fs";
import { Parser } from "htmlparser2";
import defaultValues from "./src/types/defaultValues";

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
const version: [number, number, number] = app
  .getVersion()
  ?.split(".")
  .map((n) => Number(n))
  .concat([0, 0, 0])
  .slice(0, 3) as [number, number, number];

app.on("ready", () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
    },
  });
  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
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
  JsonManage.init("setting", settingPath, defaultValues.defTsetting);

  const pluginDir = path.join(app.getPath("userData"), "plugins");
  console.log(fs.existsSync(pluginDir));
  if (!fs.existsSync(pluginDir)) fs.mkdirSync(pluginDir);
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
      JsonManage.init(jsonName, jsonPath, {
        ver: version,
        cols: {},
      });
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
  const fileName = path.basename(data.path);
  const jsonName = dirPath;
  const jsonPath = path.resolve(dirPath, "modifier.json");
  if (!JsonManage.isDefined(jsonName))
    JsonManage.init(jsonName, jsonPath, {
      ...defaultValues.defTlogfileSetting,
      ver: version,
    } as TlogfileSetting);
  let modifierJson: TlogfileSetting = getModifier(JsonManage.get(jsonName));
  modifierJson.cols[fileName] = data;
  setModifier(jsonName, modifierJson);
});

ipcMain.handle("logdata:get", (_event, id: string) => {
  const filepath = decodeURIComponent(id);
  const _temp = filepath.split("\\");
  const fileName = _temp.pop() as string;
  const dirPath = _temp.join("\\");
  const jsonPath = path.resolve(dirPath, "modifier.json");
  if (!JsonManage.isDefined(dirPath))
    JsonManage.init(dirPath, jsonPath, {
      ...defaultValues.defTlogfileSetting,
      ver: version,
    } as TlogfileSetting);
  let modifierJson: TlogfileSetting = getModifier(JsonManage.get(dirPath));
  const res: TlogfileData = {
    metadata: {
      name: modifierJson.cols?.[fileName]?.name || fileName,
      path: id,
      date: modifierJson.cols?.[fileName]?.date || 0,
      tag: modifierJson.cols?.[fileName]?.tag || [],
      tabs: modifierJson.cols?.[fileName]?.tabs || {},
    },
    colmuns: [],
  };
  let currentLogdata: TlogcolumnData = { ...defaultValues.defTlogcolumnData };
  let isSpan = false;
  let spanIndex = 0;

  const parser = new Parser({
    onopentag(name, attr) {
      if (name === "p") {
        currentLogdata = { ...defaultValues.defTlogcolumnData };
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
        if (!(currentLogdata.tab in res.metadata.tabs)) {
          res.metadata.tabs[currentLogdata.tab] = {
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
        ...defaultValues.defTlogfileSetting,
        ver: version,
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
    setModifier(dirPath, json);
    return;
  }
);

ipcMain.handle("bookmark:get", (_event, id: string): number => {
  const filepath = decodeURIComponent(id);
  const _temp = filepath.split("\\");
  const fileName = _temp.pop();
  const dirPath = _temp.join("\\");
  const jsonPath = path.resolve(dirPath, "modifier.json");

  if (!fileName) return 0;
  if (!JsonManage.isDefined(dirPath))
    JsonManage.init(dirPath, jsonPath, {
      ...defaultValues.defTlogfileSetting,
      ver: version,
    } as TlogfileSetting);
  const json = getModifier(JsonManage.get(dirPath));
  if (!json.cols[fileName])
    json.cols[fileName] = {
      ...defaultValues.defTlogfileMetadata,
      name: fileName,
      path: filepath,
    };
  if (!json.cols[fileName].bookmark) json.cols[fileName].bookmark = 0;
  return json.cols[fileName].bookmark;
});

ipcMain.handle("bookmark:set", (_event, id: string, index: number): void => {
  const filepath = decodeURIComponent(id);
  const _temp = filepath.split("\\");
  const fileName = _temp.pop();
  const dirPath = _temp.join("\\");
  const jsonPath = path.resolve(dirPath, "modifier.json");

  if (!fileName) return;
  if (!JsonManage.isDefined(dirPath))
    JsonManage.init(dirPath, jsonPath, {
      ...defaultValues.defTlogfileSetting,
      ver: version,
    } as TlogfileSetting);
  const json = getModifier(JsonManage.get(dirPath));
  if (!json.cols[fileName])
    json.cols[fileName] = {
      ...defaultValues.defTlogfileMetadata,
      name: fileName,
      path: filepath,
    };
  json.cols[fileName].bookmark = index;
  setModifier(dirPath, json);
  return;
});

ipcMain.handle("pluginScripts:get", async (_event) => {
  const pluginDir = path.join(app.getPath("userData"), "plugins");
  if (!fs.existsSync(pluginDir)) return [];

  return fs
    .readdirSync(pluginDir)
    .filter((file) => file.endsWith(".js"))
    .map((file) => {
      const fullPath = path.join(pluginDir, file);
      return { name: fullPath, data: fs.readFileSync(fullPath, "utf8") };
    });
});

ipcMain.handle("save-html", async (_event, name: string) => {
  setTimeout(async () => {
    if (mainWindow == null) return;
    const cleanedHtml = await mainWindow.webContents.executeJavaScript(`
      (async () => {
        const clone = document.documentElement.cloneNode(true);
        
        // 不要なタグを削除
        clone.querySelectorAll('script, link[rel="modulepreload"], link[rel="preload"],link[rel="stylesheet"]').forEach(el => el.remove());
        clone.querySelectorAll('a').forEach(el => el.setAttribute("href","?"));

        // CSSを埋め込み
        Array.from(document.styleSheets).map(async (sheet) => {
          try {
            if (sheet.href) {
              const response = await fetch(sheet.href);
              return response.ok ? await response.text() : '';
            } else {
              return Array.from(sheet.cssRules).map(rule => rule.cssText).join('\\n');
            }
          } catch (e) {
            return '';
          }
        })

        const styleSheets = await Promise.all(
          Array.from(document.styleSheets).map(async (sheet) => {
            try {
              if (sheet.href) {
                const response = await fetch(sheet.href);
                return response.ok ? await response.text() : '';
              } else {
                return Array.from(sheet.cssRules).map(rule => rule.cssText).join('\\n');
              }
            } catch (e) {
              return '';
            }
          })
        );

        const styleTag = document.createElement('style');
        styleTag.textContent = styleSheets.join('\\n');
        clone.querySelector('head').appendChild(styleTag);

        //スクロールの復活
        const scriptContent = \`
        <script>
          document.querySelectorAll("[data-radix-scroll-area-viewport]").forEach((elem) => {
            const maxHeight = elem.scrollHeight;
            const displayHeight = elem.clientHeight;
            const bar = elem.nextElementSibling;
            const thumb = bar?.firstChild;
            if (!(bar instanceof HTMLElement && thumb instanceof HTMLElement)) return;
            const thumbHeight = bar.clientHeight * Math.max(displayHeight / maxHeight, 0.05);
            bar.style.setProperty("transform", "translate3d(0, 0, 0)");
            bar.style.setProperty("--radix-scroll-area-thumb-height", \\\`\\\${thumbHeight}px\\\`);
            let progress = 0;
            elem.addEventListener("scroll", () => {
              progress = elem.scrollTop / (maxHeight - displayHeight);
              thumb.style.setProperty("translate", \\\`0 \\\${(bar.clientHeight - thumbHeight) * progress}px\\\`);
            });
            let isDragging = false;
            let startY = 0;
            let startScroll = 0;

            thumb.addEventListener("pointerdown", (e) => {
              e.preventDefault();
              isDragging = true;
              startY = e.clientY;
              startScroll = elem.scrollTop;
              document.body.style.userSelect = "none";
            });

            document.addEventListener("pointermove", (e) => {
              if (!isDragging) return;
              const currentY = e.clientY;
              const deltaY = currentY - startY;
              const scrollDelta = (deltaY / (bar.clientHeight - thumbHeight)) * (maxHeight - displayHeight);
              elem.scrollTop = startScroll + scrollDelta;
            });

            document.addEventListener("pointerup", () => {
              isDragging = false;
              document.body.style.userSelect = "";
            });
          });
        </script>\`;
        clone.querySelector("body").insertAdjacentHTML("beforeend", scriptContent);

        return clone.outerHTML;
      })();
    `);
    const filePath = path.join(
      app.getPath("userData"),
      "logfile",
      `${name}.html`
    );
    fs.writeFileSync(filePath, cleanedHtml, "utf-8");
  }, 500);
});

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
  let res = defaultValues.defTlogfileSetting;
  if (!data.ver) {
    // v1.2.0以前
    res["cols"] = data;
    // vx.x.x以前
    // } else if (!compareVersion(data["ver"], [9, 9, 9])) {
  } else {
    res = data;
  }
  res.ver = version;
  return res;
};
const setModifier = (name: string, data: TlogfileSetting): void => {
  data.ver = version;
  JsonManage.update(name, data);
};
