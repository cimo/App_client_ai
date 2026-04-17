import { IvariableBind } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelChat from "./Chat";

export interface IapiTool {
    name: string;
    argumentObject: Record<string, string>;
    icon: string;
    description: string;
}

export interface IapiRag {
    fileName: string;
    pageNumber?: string;
    citation?: string;
}

export interface IapiRagResult {
    type: string;
    resultList: IapiRag[];
}

export interface Ivariable {
    isOfflineMcp: IvariableBind<boolean>;
    toolList: IvariableBind<IapiTool[]>;
    toolSelected: IvariableBind<IapiTool>;
    taskList: IvariableBind<IapiTool[]>;
    taskSelected: IvariableBind<IapiTool>;
    fileUploadedList: IvariableBind<string[]>;
    systemMode: IvariableBind<string>;
    chatMessageList: IvariableBind<modelChat.IchatMessage[]>;
}

export interface Imethod {
    onClickChipUpload: () => void;
    onClickChipClose: () => void;
}

export interface IelementHook extends Record<string, Element | Element[]> {}
