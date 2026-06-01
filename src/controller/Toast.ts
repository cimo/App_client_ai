import { Icontroller, IvirtualNode, variableBind, IvariableEffect } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelToast from "../model/Toast";
import viewToast from "../view/Toast";

export default class Toast implements Icontroller {
    // Variable
    private variableObject: modelToast.Ivariable;
    private methodObject: modelToast.Imethod;

    // Method
    private onClickClose = (event: Event): void => {
        event.stopPropagation();

        this.variableObject.mode.state = "";
        this.variableObject.messageList.state = [];
    };

    show(mode: string, messageList: string[], timeClose = 3000): void {
        this.variableObject.mode.state = mode;
        this.variableObject.messageList.state = messageList;
        this.variableObject.timeClose.state = timeClose;

        if (timeClose > 0) {
            setTimeout(() => {
                this.variableObject.mode.state = "";
                this.variableObject.messageList.state = [];
            }, timeClose);
        }
    }

    constructor() {
        this.variableObject = {} as modelToast.Ivariable;
        this.methodObject = {} as modelToast.Imethod;
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
