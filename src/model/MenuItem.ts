import { IvariableBind } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelIndex from "../model/Index";

export interface Ivariable {
    isMenuItemFile: IvariableBind<boolean>;
    fileUploadedList: IvariableBind<string[]>;
    isMenuItemTool: IvariableBind<boolean>;
    toolList: IvariableBind<modelIndex.IapiMcpTool[]>;
    toolSelected: IvariableBind<modelIndex.IapiMcpTool>;
    isMenuItemTask: IvariableBind<boolean>;
    isMenuItemAgent: IvariableBind<boolean>;
    systemMode: IvariableBind<string>;
}

export interface Imethod {
    onClickMenuFile: () => void;
    onClickFileUploadDelete: (index: number, fileName: string) => void;
    onClickMenuTool: () => void;
    onClickToolName: (name: string) => void;
    onClickMenuTask: () => void;
    onClickMenuAgent: () => void;
}

export interface IelementHook extends Record<string, Element | Element[]> {}
