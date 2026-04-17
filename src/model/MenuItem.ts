import { IvariableBind } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelMcp from "../model/Mcp";

export interface Ivariable {
    isMenuItemFile: IvariableBind<boolean>;
    isMenuItemTool: IvariableBind<boolean>;
    isMenuItemTask: IvariableBind<boolean>;
    isMenuItemAgent: IvariableBind<boolean>;
    toolList: IvariableBind<modelMcp.IapiTool[]>;
    toolSelected: IvariableBind<modelMcp.IapiTool>;
    taskList: IvariableBind<modelMcp.IapiTool[]>;
    taskSelected: IvariableBind<modelMcp.IapiTool>;
    fileUploadedList: IvariableBind<string[]>;
    systemMode: IvariableBind<string>;
}

export interface Imethod {
    onClickMenuFile: () => void;
    onClickFileUploadDelete: (event: Event, index: number, fileName: string) => void;
    onClickMenuTool: () => void;
    onClickTool: (name: string) => void;
    onClickMenuTask: () => void;
    onClickTask: (name: string) => void;
    onClickMenuAgent: () => void;
    openDocument: (title: string) => void;
}

export interface IelementHook extends Record<string, Element | Element[]> {}
