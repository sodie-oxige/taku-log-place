import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  windowClose: () => ipcRenderer.invoke("window-close"),
  windowMaximize: () => ipcRenderer.invoke("window-maximize"),
  windowMinimize: () => ipcRenderer.invoke("window-minimize"),
});
