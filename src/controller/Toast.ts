import { Icontroller, IvirtualNode, variableBind, IvariableEffect } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelToast from "../model/Toast";
import viewToast from "../view/Toast";

export default class Toast implements Icontroller {
    // Variable
    private variableObject: modelToast.Ivariable;
    private viewNodeEmpty: IvirtualNode;

    // Method
    constructor() {
        this.variableObject = {} as modelToast.Ivariable;
        this.viewNodeEmpty = { tag: "div", propertyObject: {}, childrenList: [] };
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
