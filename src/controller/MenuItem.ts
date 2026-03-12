import { Icontroller, IvirtualNode, variableBind, variableLink } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelMenuItem from "../model/MenuItem";
import * as viewMenuItem from "../view/MenuItem";
import type Index from "./Index";

export default class MenuItem implements Icontroller {
    // Variable
    private variableObject: modelMenuItem.Ivariable;
    private methodObject: modelMenuItem.Imethod;
    private controllerIndex: Index;

    // Method
    private onClickMenuFile = (): void => {
        this.controllerIndex.apiMcpFileUploaded();

        this.variableObject.isMenuItemFile.state = !this.variableObject.isMenuItemFile.state;
        this.variableObject.isMenuItemTool.state = false;
        this.variableObject.isMenuItemTask.state = false;
        this.variableObject.isMenuItemAgent.state = false;
    };

    private onClickMenuTool = (): void => {
        this.variableObject.isMenuItemFile.state = false;
        this.variableObject.isMenuItemTool.state = !this.variableObject.isMenuItemTool.state;
        this.variableObject.isMenuItemTask.state = false;
        this.variableObject.isMenuItemAgent.state = false;
    };

    private onClickMenuTask = (): void => {
        this.variableObject.isMenuItemFile.state = false;
        this.variableObject.isMenuItemTool.state = false;
        this.variableObject.isMenuItemTask.state = !this.variableObject.isMenuItemTask.state;
        this.variableObject.isMenuItemAgent.state = false;
    };

    private onClickMenuAgent = (): void => {
        this.variableObject.isMenuItemFile.state = false;
        this.variableObject.isMenuItemTool.state = false;
        this.variableObject.isMenuItemTask.state = false;
        this.variableObject.isMenuItemAgent.state = !this.variableObject.isMenuItemAgent.state;
    };

    private onClickFileUploadDelete = (index: number, fileName: string): void => {
        this.controllerIndex.apiMcpFileUploadedDelete(index, fileName);
    };

    constructor(controllerIndex: Index) {
        this.variableObject = {} as modelMenuItem.Ivariable;
        this.methodObject = {} as modelMenuItem.Imethod;
        this.controllerIndex = controllerIndex;
    }

    hookObject = {} as modelMenuItem.IelementHook;

    variable(): void {
        this.variableObject = variableBind(
            {
                isMenuItemFile: false,
                isMenuItemTool: false,
                isMenuItemTask: false,
                isMenuItemAgent: false,
                fileUploadedList: variableLink<string[]>("Index")
            },
            this.constructor.name
        );

        this.methodObject = {
            onClickMenuFile: this.onClickMenuFile,
            onClickMenuTool: this.onClickMenuTool,
            onClickMenuTask: this.onClickMenuTask,
            onClickMenuAgent: this.onClickMenuAgent,
            onClickFileUploadDelete: this.onClickFileUploadDelete
        };
    }

    variableEffect(): void {}

    view(name?: string): IvirtualNode {
        if (name === "viewMenuItemLeft") {
            return viewMenuItem.viewMenuItemLeft(this.variableObject, this.methodObject);
        } else if (name === "viewMenuItemRight") {
            return viewMenuItem.viewMenuItemRight(this.variableObject, this.methodObject);
        }

        throw new Error(`Unsupported view: ${String(name)}`);
    }

    event(): void {}

    subControllerList(): Icontroller[] {
        const list: Icontroller[] = [];

        return list;
    }

    rendered(): void {}

    destroy(): void {}
}
