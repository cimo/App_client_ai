import { Icontroller, IvirtualNode, variableBind, variableLink } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelMenuItem from "../model/MenuItem";
import * as modelIndex from "../model/Index";
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

    private onClickFileUploadDelete = (index: number, fileName: string): void => {
        this.controllerIndex.apiMcpFileUploadedDelete(index, fileName);
    };

    private onClickMenuTool = (): void => {
        this.variableObject.isMenuItemFile.state = false;
        this.variableObject.isMenuItemTool.state = !this.variableObject.isMenuItemTool.state;
        this.variableObject.isMenuItemTask.state = false;
        this.variableObject.isMenuItemAgent.state = false;
    };

    private onClickToolName = (name: string): void => {
        for (const tool of this.variableObject.toolList.state) {
            if (tool.name === name) {
                this.variableObject.toolSelected.state = tool;

                this.variableObject.isMenuItemTool.state = false;

                break;
            }
        }

        this.variableObject.systemMode.state = "tool-call";
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
                fileUploadedList: variableLink<string[]>("Index"),
                isMenuItemTool: false,
                toolList: variableLink<modelIndex.IapiMcpTool[]>("Index"),
                toolSelected: variableLink<modelIndex.IapiMcpTool>("Index"),
                isMenuItemTask: false,
                isMenuItemAgent: false,
                systemMode: variableLink<string>("Index")
            },
            this.constructor.name
        );

        this.methodObject = {
            onClickMenuFile: this.onClickMenuFile,
            onClickFileUploadDelete: this.onClickFileUploadDelete,
            onClickMenuTool: this.onClickMenuTool,
            onClickToolName: this.onClickToolName,
            onClickMenuTask: this.onClickMenuTask,
            onClickMenuAgent: this.onClickMenuAgent
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
