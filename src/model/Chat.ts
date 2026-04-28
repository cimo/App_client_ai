import { IvariableBind } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelMcp from "./Mcp";

export interface ImcpTool {
    tool_call_id: string;
    type: string;
    name: string;
    arguments: string;
    output: string;
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
    mcpTool?: ImcpTool;
    file: string;
    embedding: string;
    citation: modelMcp.IragSearch[] | undefined;
}

export interface Ifile {
    [key: string]: {
        pageNumber: string;
    };
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
    item: ImcpTool;
}

export interface Ivariable {
    isMessageSent: IvariableBind<boolean>;
    chatMessageList: IvariableBind<IchatMessage[]>;
    chatHistoryList: IvariableBind<IchatInput[]>;
    systemMode: IvariableBind<string>;
    toolSelected: IvariableBind<modelMcp.Itool>;
    toolList: IvariableBind<modelMcp.Itool[]>;
    taskSelected: IvariableBind<modelMcp.Itask>;
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
