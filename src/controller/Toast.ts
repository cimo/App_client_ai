import { Icontroller, IvirtualNode, variableBind, IvariableEffect } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelToast from "../model/Toast";
import viewToast from "../view/Toast";

export default class Toast implements Icontroller {
    // Variable
    private variableObject: modelToast.Ivariable;

    // Method
    show(mode: string, message: string): void {
        this.variableObject.mode.state = mode;
        this.variableObject.message.state = message;

        setTimeout(() => {
            this.variableObject.mode.state = "";
            this.variableObject.message.state = "";
        }, 3000);
    }

    constructor() {
        this.variableObject = {} as modelToast.Ivariable;
    }

    hookObject = {} as modelToast.IelementHook;

    variable(): void {
        this.variableObject = variableBind(
            {
                mode: "",
                message: ""
            },
            this.constructor.name
        );
    }

    variableEffect(watch: IvariableEffect): void {
        watch([]);
    }

    view(): IvirtualNode {
        return viewToast(this.variableObject);
    }

    event(): void {}

    subControllerList(): Icontroller[] {
        return [];
    }

    rendered(): void {}

    destroy(): void {}
}
