import { IvariableBind } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelMcp from "./Mcp";

export interface IapiResponseTool {
    tool_call_id: string;
    type: string;
    name: string;
    arguments: string;
    output: string;
}

export interface IapiResponse {
    type: string;
    response: {
        id: string;
        message: string;
    };
    error: {
        message: string;
    };
    delta: string;
    item: IapiResponseTool;
}

export interface IchatInput {
    role: string;
    content: string | Array<{ type: string; text?: string; image_url?: string }>;
}

export interface IchatMessage {
    time: string;
    user: string;
    assistantReason: string;
    assistantNoReason: string;
    mcpTool?: IapiResponseTool;
    file: string;
    citation: modelMcp.IapiRag[];
}

export interface Ivariable {
    isMessageSent: IvariableBind<boolean>;
    chatMessageList: IvariableBind<IchatMessage[]>;
    chatHistoryList: IvariableBind<IchatInput[]>;
    systemMode: IvariableBind<string>;
    toolSelected: IvariableBind<modelMcp.IapiTool>;
    toolList: IvariableBind<modelMcp.IapiTool[]>;
    taskSelected: IvariableBind<modelMcp.IapiTool>;
}

export interface Imethod {
    onClickButtonMessageSend: () => void;
    onClickSourceLink: (event: Event, fileName: string, citation: string) => void;
}

export interface IelementHook extends Record<string, Element | Element[]> {
    elementInputMessageSend: HTMLInputElement;
    elementContainerMessageReceive: HTMLElement;
    elementBottomLimit: HTMLElement;
}
