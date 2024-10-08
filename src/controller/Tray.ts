import * as Path from "path";

// Source
import * as ModelTray from "../model/Tray";

export const create = (Tray: typeof Electron.Tray, Menu: typeof Electron.Menu, app: Electron.App, mainWindow: Electron.BrowserWindow) => {
    const tray = new Tray(Path.join(__dirname, "../../public/image/tray.png"));

    const menu = Menu.buildFromTemplate([
        {
            label: ModelTray.MENU_1,
            click: () => {
                mainWindow.show();
            }
        },
        {
            label: ModelTray.MENU_2,
            click: () => {
                mainWindow.destroy();
                app.quit();
            }
        }
    ]);

    tray.setToolTip(app.name);
    tray.setContextMenu(menu);
};
