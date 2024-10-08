import { app, nativeTheme, globalShortcut, BrowserWindow, Tray, Menu, Notification, ipcMain } from "electron";

// Source
import * as ControllerWindow from "./controller/Window";
import * as ControllerTray from "./controller/Tray";
import * as ControllerAutomate from "./controller/Automate";

void app
    .whenReady()
    .then(() => {
        nativeTheme.themeSource = "dark";

        void init();
    })
    .catch();

/*ipcMain.on("appIpc", () => {
    new Notification({
        title: "cimo",
        body: "test"
    }).show();
});*/

app.on("will-quit", () => {
    globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        void init();
    }
});

const init = async () => {
    const mainWindow = await ControllerWindow.create(app, BrowserWindow);
    ControllerTray.create(Tray, Menu, app, mainWindow);
    ControllerAutomate.keyAction(globalShortcut, Notification);
};
