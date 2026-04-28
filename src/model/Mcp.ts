import { IvariableBind } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelChat from "./Chat";

export interface Itool {
    name: string;
    argumentObject: Record<string, string>;
    icon: string;
    description: string;
}

export interface Itask {
    name: string;
    argumentObject: Record<string, string>;
    icon: string;
    description: string;
}

export interface IragSearch {
    fileName: string;
    citation: string;
}

export interface IdocumentParser {
    fileName: string;
    terminalExecution: string;
}

export interface IfileStatus {
    fileName: string;
    status: string;
}

export interface IapiToolResponse {
    name: string;
    resultList: [];
}

export interface Ivariable {
    isOfflineMcp: IvariableBind<boolean>;
    toolList: IvariableBind<Itool[]>;
    toolSelected: IvariableBind<Itool>;
    taskList: IvariableBind<Itask[]>;
    taskSelected: IvariableBind<Itask>;
    fileUploadedList: IvariableBind<string[]>;
    systemMode: IvariableBind<string>;
    chatMessageList: IvariableBind<modelChat.IchatMessage[]>;
}

export interface Imethod {
    onClickChipUpload: () => void;
    onClickChipClose: () => void;
}

export interface IelementHook extends Record<string, Element | Element[]> {}
