import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
  windowClose: () => ipcRenderer.invoke("window-close"),
  windowMaximize: () => ipcRenderer.invoke("window-maximize"),
  windowMinimize: () => ipcRenderer.invoke("window-minimize"),
  logdirAdd: async () => ipcRenderer.invoke("logdir:add"),
  logdirGet: () => ipcRenderer.invoke("logdir:get"),
  logfilesGet: () => ipcRenderer.invoke("logfiles:get"),
  logfileSet: (data: TlogTableColumn) => ipcRenderer.invoke("logfile:set", data),
  logdataGet: (id: string) => ipcRenderer.invoke("logdata:get", id),
});
