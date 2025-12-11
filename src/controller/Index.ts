import { Icontroller, IvariableEffect, IvirtualNode, variableBind } from "@cimo/jsmvcfw/dist/src/Main.js";
import { invoke } from "@tauri-apps/api/core";

// Source
import * as modelIndex from "../model/Index";
import viewIndex from "../view/Index";

export default class Index implements Icontroller {
    // Variable
    private variableObject: modelIndex.Ivariable;
    private methodObject: modelIndex.Imethod;

    // Method
    private onClickCount = async (): Promise<void> => {
        this.variableObject.count.state += 1;
    };

    private onClickButton = async (): Promise<void> => {
        const result: string = await invoke("send_message", {
            message: this.hookObject.elementInputMessage.value
        });

        this.hookObject.elementResultMessage.innerText = result;
    };

    constructor() {
        this.variableObject = {} as modelIndex.Ivariable;
        this.methodObject = {} as modelIndex.Imethod;
    }

    hookObject = {} as modelIndex.IelementHook;

    variable(): void {
        this.variableObject = variableBind(
            {
                count: 0
            },
            this.constructor.name
        );

        this.methodObject = {
            onClickCount: this.onClickCount,
            onClickButton: this.onClickButton
        };
    }

    variableEffect(watch: IvariableEffect): void {
        watch([]);
    }

    view(): IvirtualNode {
        return viewIndex(this.variableObject, this.methodObject);
    }

    event(): void {}

    subControllerList(): Icontroller[] {
        const resultList: Icontroller[] = [];

        return resultList;
    }

    rendered(): void {}

    destroy(): void {}
}
