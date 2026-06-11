import { Icontroller, IvirtualNode, variableBind, IvariableEffect } from "@cimo/jsmvcfw/dist/src/Main.js";
import { listen, emitTo, UnlistenFn } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";

// Source
import * as helperSrc from "../HelperSrc";
import * as modelDialog from "../model/Dialog";
import viewDialog from "../view/Dialog";

export default class Dialog implements Icontroller {
    // Variable
    private variableObject: modelDialog.Ivariable;
    private methodObject: modelDialog.Imethod;

    private unlistenWindowData: UnlistenFn | undefined = undefined;

    private isOpen = false;

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

    getIsOpen(): boolean {
        return this.isOpen;
    }

    show(mode: string, message: string, isConfirm: boolean): Promise<boolean> {
        let result: Promise<boolean>;

        if (!this.isOpen) {
            this.isOpen = true;

            const route = "#/dialog";

            result = new Promise((resolve) => {
                const windowLabel = helperSrc.windowLabelUnique("dialog", mode);

                let unlistenWindowReady: UnlistenFn | undefined = undefined;
                let unlistenWindowResult: UnlistenFn | undefined = undefined;

                listen(`dialog-${windowLabel}-ready`, () => {
                    emitTo(windowLabel, "dialog-data", { mode, message, isConfirm });

                    if (unlistenWindowReady !== undefined) {
                        unlistenWindowReady();

                        unlistenWindowReady = undefined;
                    }
                }).then((unlistenFn) => {
                    unlistenWindowReady = unlistenFn;
                });

                listen<boolean>(`dialog-${windowLabel}-result`, (event) => {
                    this.isOpen = false;

                    resolve(event.payload);

                    if (unlistenWindowResult !== undefined) {
                        unlistenWindowResult();

                        unlistenWindowResult = undefined;
                    }
                }).then((unlistenFn) => {
                    unlistenWindowResult = unlistenFn;
                });

                helperSrc.windowOpen("dialog", mode, route, {
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
        } else {
            result = Promise.resolve(false);
        }

        return result;
    }

    constructor() {
        this.variableObject = {} as modelDialog.Ivariable;
        this.methodObject = {} as modelDialog.Imethod;
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
        }).then(async (unlistenFn) => {
            this.unlistenWindowData = unlistenFn;

            const currentWindow = getCurrentWindow();

            await emitTo("main", `dialog-${currentWindow.label}-ready`);
        });
    }

    subControllerList(): Icontroller[] {
        return [];
    }

    rendered(): void {}

    destroy(): void {
        if (this.unlistenWindowData !== undefined) {
            this.unlistenWindowData();

            this.unlistenWindowData = undefined;
        }
    }
}
