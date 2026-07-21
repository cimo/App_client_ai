import { IvariableBind } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelMcp from "./Mcp";

export interface IapiDataResponseBody {
    stream: boolean;
    model: string;
    input: IdataInput[];
    tools: unknown[];
    temperature?: number;
}

export interface IdataMessage {
    isLoading: boolean;
    time: string;
    user: string;
    assistantReason: string;
    assistantNoReason: string;
    mcpTool?: ImcpTool;
    ragCitationList: modelMcp.IragCitation[] | undefined;
    ragCitationTabIndex: number;
    securityScanner: string;
    playwright: Iplaywright;
}

export interface IdataInput {
    role: string;
    content: string | Array<{ type: string; text?: string; image_url?: string }>;
}

export interface ImcpTool {
    tool_call_id: string;
    type: string;
    name: string;
    arguments: string;
    output: string;
}

export interface Iplaywright {
    action: string;
    nameList: string[];
    stdout: string;
}

export interface Ifile {
    [key: string]: {
        searchInput: string;
    };
}

export interface IllmResponse {
    type: string;
    response: {
        id: string;
        name: string;
        arguments: string;
        message: string;
    };
    error: {
        message: string;
    };
    delta: string;
    item: ImcpTool;
}

export interface Ivariable {
    isMessageSendAvailable: IvariableBind<boolean>;
    messageList: IvariableBind<IdataMessage[]>;
    historyList: IvariableBind<IdataInput[]>;
    systemMode: IvariableBind<string>;
    toolSelected: IvariableBind<modelMcp.Itool>;
    toolList: IvariableBind<modelMcp.Itool[]>;
    taskSelected: IvariableBind<modelMcp.Itask>;
    agentSelected: IvariableBind<modelMcp.Iagent>;
    playwrightVideoSrc: IvariableBind<string>;
    playwrightVideoName: IvariableBind<string>;
}

export interface Imethod {
    onClickButtonMessageSend: () => void;
    onClickCitationLink: (event: Event, fileName: string, chunk: string) => void;
    onClickCitationTab: (messageIndex: number, tabIndex: number) => void;
    onClickPlaywrightVideoShow: (fileName: string) => void;
    onErrorPlaywrightVideoFail: () => void;
}

export interface IelementHook extends Record<string, Element | Element[]> {
    elementInputMessageSend: HTMLInputElement;
    elementContainerMessageReceive: HTMLElement;
    elementBottomLimit: HTMLElement;
    elementMessageStreamReasonWrapper: HTMLElement;
    elementMessageStreamReason: HTMLPreElement;
    elementMessageStreamNoReason: HTMLPreElement;
}
