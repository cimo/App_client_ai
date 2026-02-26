import { IvariableBind } from "@cimo/jsmvcfw/dist/src/Main.js";

export interface IapiAiModel {
    id: string;
    object: string;
    owned_by: string;
}

export interface IapiAiResponseItem {
    tool_call_id: string;
    type: string;
    name: string;
    arguments: string;
    output: string;
}

export interface IapiAiResponse {
    type: string;
    output_index: number;
    sequence_number: number;
    delta: string;
    item: IapiAiResponseItem;
    response: {
        id: string;
        message: string;
    };
    error: {
        code: string;
        message: string;
        param: string;
        type: string;
    };
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
    mcpTool?: IapiAiResponseItem;
    file: string;
}

export interface Itool {
    type: string;
    server_label: string;
    server_url: string;
    allowed_tools: string[];
    headers: {
        Cookie: string;
    };
}

export interface IresponseBody {
    response: {
        stdout: string;
        stderr: string | Error;
    };
}

export interface Ivariable {
    modelList: IvariableBind<IapiAiModel[]>;
    modelSelected: IvariableBind<string>;
    chatHistory: IvariableBind<IchatInput[]>;
    chatMessage: IvariableBind<IchatMessage[]>;
    isOpenDialogModelList: IvariableBind<boolean>;
    isOfflineAi: IvariableBind<boolean>;
    isOfflineMcp: IvariableBind<boolean>;
    adUrl: IvariableBind<string>;
    agentMode: IvariableBind<string>;
}

export interface Imethod {
    onClickButtonUpload: () => void;
    onClickButtonToolCall: () => void;
    onClickButtonToolTask: () => void;
    onClickButtonMessageSend: () => void;
    onClickButtonModel: () => void;
    onClickModelName: (name: string) => void;
    onClickRefreshPage: () => void;
    onClickAd: (event: Event) => void;
}

export interface IelementHook extends Record<string, Element | Element[]> {
    elementInputMessageSend: HTMLInputElement;
    elementContainerMessageReceive: HTMLElement;
    elementBottomLimit: HTMLElement;
}
