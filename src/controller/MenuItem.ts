import { Icontroller, IvirtualNode, variableBind, variableLink } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as helperSrc from "../HelperSrc";
import * as modelMenuItem from "../model/MenuItem";
import * as modelMcp from "../model/Mcp";
import * as viewMenuItem from "../view/MenuItem";
import type Mcp from "./Mcp";

export default class MenuItem implements Icontroller {
    // Variable
    private variableObject: modelMenuItem.Ivariable;
    private methodObject: modelMenuItem.Imethod;
    private controllerMcp: Mcp;

    // Method
    private onClickMenuFile = (): void => {
        this.controllerMcp.apiFileUploaded().then(() => {
            this.variableObject.isMenuItemFile.state = !this.variableObject.isMenuItemFile.state;
            this.variableObject.isMenuItemTool.state = false;
            this.variableObject.isMenuItemTask.state = false;
            this.variableObject.isMenuItemAgent.state = false;
        });
    };

    private onClickFileUploadDelete = (event: Event, index: number, fileName: string): void => {
        event.stopPropagation();

        this.controllerMcp.apiFileUploadedDelete(index, fileName);
    };

    private onClickMenuTool = (): void => {
        this.variableObject.isMenuItemFile.state = false;
        this.variableObject.isMenuItemTool.state = !this.variableObject.isMenuItemTool.state;
        this.variableObject.isMenuItemTask.state = false;
        this.variableObject.isMenuItemAgent.state = false;
    };

    private onClickTool = (name: string): void => {
        this.variableObject.toolSelected.state = {} as modelMcp.Itool;
        this.variableObject.taskSelected.state = {} as modelMcp.Itask;

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

    private onClickTask = (name: string): void => {
        this.variableObject.toolSelected.state = {} as modelMcp.Itool;
        this.variableObject.taskSelected.state = {} as modelMcp.Itask;

        for (const tool of this.variableObject.taskList.state) {
            if (tool.name === name) {
                this.variableObject.taskSelected.state = tool;

                this.variableObject.isMenuItemTask.state = false;

                break;
            }
        }

        this.variableObject.systemMode.state = "task-call";
    };

    private onClickMenuAgent = (): void => {
        this.variableObject.isMenuItemFile.state = false;
        this.variableObject.isMenuItemTool.state = false;
        this.variableObject.isMenuItemTask.state = false;
        this.variableObject.isMenuItemAgent.state = !this.variableObject.isMenuItemAgent.state;
    };

    private openDocument = async (title: string): Promise<void> => {
        await helperSrc.openWindow("document", title, "#/document");
    };

    setControllerMcp(controller: Mcp): void {
        this.controllerMcp = controller;
    }

    constructor() {
        this.variableObject = {} as modelMenuItem.Ivariable;
        this.methodObject = {} as modelMenuItem.Imethod;

        this.controllerMcp = {} as Mcp;
    }

    hookObject = {} as modelMenuItem.IelementHook;

    variable(): void {
        this.variableObject = variableBind(
            {
                isMenuItemFile: false,
                isMenuItemTool: false,
                isMenuItemTask: false,
                isMenuItemAgent: false,
                toolList: variableLink<modelMcp.Itool[]>("Mcp"),
                toolSelected: variableLink<modelMcp.Itool>("Mcp"),
                taskList: variableLink<modelMcp.Itask[]>("Mcp"),
                taskSelected: variableLink<modelMcp.Itask>("Mcp"),
                fileUploadedList: variableLink<string[]>("Mcp"),
                systemMode: variableLink<string>("Chat")
            },
            this.constructor.name
        );

        this.methodObject = {
            onClickMenuFile: this.onClickMenuFile,
            onClickFileUploadDelete: this.onClickFileUploadDelete,
            onClickMenuTool: this.onClickMenuTool,
            onClickTool: this.onClickTool,
            onClickMenuTask: this.onClickMenuTask,
            onClickTask: this.onClickTask,
            onClickMenuAgent: this.onClickMenuAgent,
            openDocument: this.openDocument
        };
    }

    variableEffect(): void {}

    view(name?: string): IvirtualNode {
        if (name === "left") {
            return viewMenuItem.left(this.variableObject, this.methodObject);
        } else if (name === "right") {
            return viewMenuItem.right(this.variableObject, this.methodObject);
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
