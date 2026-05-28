import { setUrlRoot, setAppLabel, route, navigateTo } from "@cimo/jsmvcfw/dist/src/Main.js";
import { emitTo, listen, UnlistenFn } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";

// Source
import * as session from "./Session";
import ControllerIndex from "./controller/Index";
import ControllerDocument from "./controller/Document";
import ControllerDialog from "./controller/Dialog";

setUrlRoot("");
setAppLabel("jsmvcfw");

session.syncFromStorage();

document.documentElement.setAttribute("data-theme", "dark");
document.documentElement.style.colorScheme = "dark";

route([
    {
        title: "Index",
        path: "/",
        controller: () => new ControllerIndex()
    },
    {
        title: "Document",
        path: "/document",
        controller: () => new ControllerDocument()
    },
    {
        title: "Dialog",
        path: "/dialog",
        controller: () => new ControllerDialog()
    }
]);

const currentWindow = getCurrentWindow();

let unlisten: UnlistenFn | null = null;

listen<string>("window-data", (event) => {
    if (currentWindow.label === "main") {
        return;
    }

    const path = event.payload;

    if (typeof path === "string" && path.startsWith("#/")) {
        navigateTo(path.slice(path.indexOf("#") + 1), true);
    }

    if (unlisten !== null) {
        unlisten();

        unlisten = null;
    }
}).then(async (unlistenFn) => {
    unlisten = unlistenFn;

    if (currentWindow.label !== "main") {
        await emitTo("main", `window-${currentWindow.label}-ready`);
    }
});
