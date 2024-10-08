import * as Path from "path";

// Source
import * as ModelWindow from "../model/Window";

export const create = async (app: Electron.App, browserWindow: typeof Electron.BrowserWindow) => {
    const mainWindow = new browserWindow({
        width: ModelWindow.WIDTH,
        height: ModelWindow.HEIGHT,
        title: ModelWindow.TITLE,
        autoHideMenuBar: true,
        minimizable: false,
        resizable: false,
        webPreferences: {
            nodeIntegration: false,
            webSecurity: true,
            contextIsolation: true,
            preload: Path.join(__dirname, "../preload.ts")
        }
    });

    if (!app.isPackaged) {
        mainWindow.webContents.openDevTools({ mode: "detach" });
    }

    mainWindow.on("page-title-updated", function (event) {
        event.preventDefault();
    });

    mainWindow.on("close", (event) => {
        event.preventDefault();

        mainWindow.hide();
    });

    await mainWindow.loadFile(Path.join(__dirname, "../../public/index.html"));

    return mainWindow;
};
