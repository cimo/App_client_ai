import { Icontroller, IvirtualNode, variableBind, IvariableEffect } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelToast from "../model/Toast";
import viewToast from "../view/Toast";

export default class Toast implements Icontroller {
    // Variable
    private variableObject: modelToast.Ivariable;

    // Method
    constructor() {
        this.variableObject = {} as modelToast.Ivariable;
    }

    hookObject = {} as modelToast.IelementHook;

    variable(): void {
        this.variableObject = variableBind(
            {
                toastMessage: "",
                toastType: ""
            },
            this.constructor.name
        );
    }

    variableEffect(watch: IvariableEffect): void {
        watch([
            {
                list: ["toastMessage", "toastType"],
                action: () => {
                    if (this.variableObject.toastMessage.state !== "") {
                        setTimeout(() => {
                            this.variableObject.toastMessage.state = "";
                            this.variableObject.toastType.state = "";
                        }, 3000);
                    }
                }
            }
        ]);
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
