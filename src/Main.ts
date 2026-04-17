import { setUrlRoot, setAppLabel, route, navigateTo } from "@cimo/jsmvcfw/dist/src/Main.js";
import { emitTo, listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";

// Source
import * as session from "./Session";
import ControllerIndex from "./controller/Index";
import ControllerDocument from "./controller/Document";

setUrlRoot("");
setAppLabel("jsmvcfw");

session.syncFromStorage();

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
    }
]);

const currentWindow = getCurrentWindow();

if (currentWindow.label !== "main") {
    emitTo("main", `window-${currentWindow.label}-ready`);
}

listen<string>("window-init", (event) => {
    if (currentWindow.label === "main") {
        return;
    }

    const path = event.payload;

    if (typeof path === "string" && path.startsWith("#/")) {
        navigateTo(path.slice(path.indexOf("#") + 1), true);
    }
}).then((unlisten) => {
    unlisten();
});
