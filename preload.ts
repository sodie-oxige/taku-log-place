import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
  windowClose: () => ipcRenderer.invoke("window-close"),
  windowMaximize: () => ipcRenderer.invoke("window-maximize"),
  windowMinimize: () => ipcRenderer.invoke("window-minimize"),
  logdirAdd: async () => ipcRenderer.invoke("logdir:add"),
  logdirGet: async () => ipcRenderer.invoke("logdir:get"),
  logfileGet: async () => ipcRenderer.invoke("logfile:get"),
  logdataGet: async (id: string) => ipcRenderer.invoke("logdata:get"),
});
