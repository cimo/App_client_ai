import { Icontroller, IvirtualNode, variableBind } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelAi from "../model/Ai";
import viewAi from "../view/Ai";

export default class Ai implements Icontroller {
    // Variable
    private variableObject: modelAi.Ivariable;
    private methodObject: modelAi.Imethod;

    // Method
    constructor() {
        this.variableObject = {} as modelAi.Ivariable;
        this.methodObject = {} as modelAi.Imethod;
    }

    hookObject = {} as modelAi.IelementHook;

    variable(): void {
        this.variableObject = variableBind({}, this.constructor.name);

        this.methodObject = {};
    }

    variableEffect(): void {}

    view(): IvirtualNode {
        return viewAi(this.variableObject, this.methodObject);
    }

    event(): void {}

    subControllerList(): Icontroller[] {
        const list: Icontroller[] = [];

        return list;
    }

    rendered(): void {}

    destroy(): void {}
}
