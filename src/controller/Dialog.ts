import { Icontroller, IvirtualNode, variableBind, IvariableEffect } from "@cimo/jsmvcfw/dist/src/Main.js";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { listen, emitTo } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";

// Source
import * as helperSrc from "../HelperSrc";
import * as modelDialog from "../model/Dialog";
import viewDialog from "../view/Dialog";

export default class Dialog implements Icontroller {
    // Variable
    private variableObject: modelDialog.Ivariable;
    private methodObject: modelDialog.Imethod;

    private window: WebviewWindow;

    // Method
    private async onClickOk(): Promise<void> {
        const currentWindow = getCurrentWindow();

        await emitTo("main", `dialog-${currentWindow.label}-result`, true);

        currentWindow.close();
    }

    private async onClickCancel(): Promise<void> {
        const currentWindow = getCurrentWindow();

        await emitTo("main", `dialog-${currentWindow.label}-result`, false);

        currentWindow.close();
    }

    async show(mode: string, message: string, isConfirm: boolean): Promise<boolean> {
        const route = "#/dialog";

        return new Promise(async (resolve) => {
            const windowLabel = helperSrc.windowLabelUnique("dialog", mode);

            const unlistenReady = await listen(`dialog-${windowLabel}-ready`, async () => {
                await emitTo(windowLabel, "dialog-data", { mode, message, isConfirm });

                unlistenReady();
            });

            const unlistenResult = await listen<boolean>(`dialog-${windowLabel}-result`, (event) => {
                resolve(event.payload);

                unlistenResult();
            });

            this.window = await helperSrc.windowOpen("dialog", mode, route, {
                title: mode,
                url: route,
                decorations: true,
                resizable: false,
                minimizable: false,
                closable: false,
                width: 400,
                height: 250,
                minWidth: 400,
                minHeight: 250,
                center: true,
                focus: true
            });
        });
    }

    constructor() {
        this.variableObject = {} as modelDialog.Ivariable;
        this.methodObject = {} as modelDialog.Imethod;

        this.window = undefined as unknown as WebviewWindow;
    }

    hookObject = {} as modelDialog.IelementHook;

    variable(): void {
        this.variableObject = variableBind(
            {
                mode: "",
                message: "",
                isConfirm: false
            },
            this.constructor.name
        );

        this.methodObject = {
            onClickOk: this.onClickOk,
            onClickCancel: this.onClickCancel
        };
    }

    variableEffect(watch: IvariableEffect): void {
        watch([]);
    }

    view(): IvirtualNode {
        return viewDialog(this.variableObject, this.methodObject);
    }

    event(): void {
        listen<modelDialog.Idata>("dialog-data", (event) => {
            this.variableObject.mode.state = event.payload.mode;
            this.variableObject.message.state = event.payload.message;
            this.variableObject.isConfirm.state = event.payload.isConfirm;
        }).then(async () => {
            const currentWindow = getCurrentWindow();

            await emitTo("main", `dialog-${currentWindow.label}-ready`);
        });
    }

    subControllerList(): Icontroller[] {
        return [];
    }

    rendered(): void {}

    destroy(): void {}
}
