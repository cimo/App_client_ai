/*import { contextBridge, ipcRenderer } from "electron";

// eslint-disable-next-line no-undef
window.addEventListener("DOMContentLoaded", () => {
    const replaceText = (selector, text) => {
        // eslint-disable-next-line no-undef, @typescript-eslint/no-unsafe-argument
        const element = document.getElementById(selector);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        if (element) element.innerText = text;
    };

    for (const type of ["chrome", "node", "electron"]) {
        replaceText(`${type}-version`, process.versions[type]);
    }
});

contextBridge.exposeInMainWorld("versions", {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
});

contextBridge.exposeInMainWorld("ipc", {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    send: ipcRenderer.send
});*/
