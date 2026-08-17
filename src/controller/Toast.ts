import { Icontroller, IvirtualNode, variableBind, IvariableEffect } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelToast from "../model/Toast";
import viewToast from "../view/Toast";

export default class Toast implements Icontroller {
    // Variable
    private variableObject: modelToast.Ivariable;
    private methodObject: modelToast.Imethod;

    private timeout: ReturnType<typeof setTimeout> | undefined;

    // Method
    private onClickClose = (): void => {
        this.variableObject.mode.state = "";
        this.variableObject.messageList.state = [];
    };

    show(mode: string, messageList: string[], timeClose = 3000): void {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }

        this.variableObject.mode.state = mode;
        this.variableObject.messageList.state = messageList;
        this.variableObject.timeClose.state = timeClose;

        if (timeClose > 0) {
            this.timeout = setTimeout(() => {
                this.variableObject.mode.state = "";
                this.variableObject.messageList.state = [];
            }, timeClose);
        }
    }

    constructor() {
        this.variableObject = {} as modelToast.Ivariable;
        this.methodObject = {} as modelToast.Imethod;

        this.timeout = undefined;
    }

    hookObject = {} as modelToast.IelementHook;

    variable(): void {
        this.variableObject = variableBind(
            {
                mode: "",
                messageList: [],
                timeClose: 0
            },
            this.constructor.name
        );

        this.methodObject = {
            onClickClose: this.onClickClose
        };
    }

    variableEffect(watch: IvariableEffect): void {
        watch([]);
    }

    view(): IvirtualNode {
        return viewToast(this.variableObject, this.methodObject);
    }

    event(): void {}

    subControllerList(): Icontroller[] {
        return [];
    }

    rendered(): void {}

    destroy(): void {}
}
