import { Icontroller, IvariableEffect, IvirtualNode, variableBind } from "@cimo/jsmvcfw/dist/src/Main.js";
//import { invoke } from "@tauri-apps/api/core";
import { fetch } from "@tauri-apps/plugin-http";

// Source
import * as modelIndex from "../model/Index";
import viewIndex from "../view/Index";

export default class Index implements Icontroller {
    // Variable
    private variableObject: modelIndex.Ivariable;
    private methodObject: modelIndex.Imethod;

    // Method
    private apiLogin = (): void => {
        fetch("https://172.20.0.1:1046/login", {
            method: "GET",
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        }).then(async () => {});
    };

    private apiModel = (): void => {
        fetch("https://172.20.0.1:1046/api/v1/models", {
            method: "GET",
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        }).then(async (result) => {
            const resultJson = (await result.json()) as modelIndex.IresponseBody;

            this.variableObject.modelList.state = JSON.parse(resultJson.response.stdout);
        });
    };

    private onClickCount = (): void => {
        this.variableObject.count.state += 1;
    };

    private onClickButton = (): void => {
        /*const result: string = await invoke("send_message", {
            message: this.hookObject.elementInputMessage.value
        });
        
        this.hookObject.elementResultMessage.innerText = result;*/

        this.apiModel();
    };

    constructor() {
        this.variableObject = {} as modelIndex.Ivariable;
        this.methodObject = {} as modelIndex.Imethod;
    }

    hookObject = {} as modelIndex.IelementHook;

    variable(): void {
        this.variableObject = variableBind(
            {
                count: 0,
                modelList: []
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

    rendered(): void {
        this.apiLogin();
    }

    destroy(): void {}
}
