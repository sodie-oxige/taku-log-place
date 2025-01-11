export {};

declare global {
  interface Window {
    electron: {
      windowClose: () => void;
      windowMaximize: () => void;
      windowMinimize: () => void;
    };
  }
}
