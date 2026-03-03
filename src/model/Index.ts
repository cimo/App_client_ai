import { IvariableBind } from "@cimo/jsmvcfw/dist/src/Main.js";

export interface IresponseBody {
    response: {
        stdout: string;
        stderr: string | Error;
    };
}

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

export interface IapiMcpTool {
    name: string;
    argumentObject: Record<string, string>;
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

export interface Ivariable {
    modelList: IvariableBind<IapiAiModel[]>;
    chatHistoryList: IvariableBind<IchatInput[]>;
    chatMessageList: IvariableBind<IchatMessage[]>;
    isOpenDropdownModelList: IvariableBind<boolean>;
    modelSelected: IvariableBind<string>;
    toolList: IvariableBind<IapiMcpTool[]>;
    isOpenDropdownToolList: IvariableBind<boolean>;
    toolSelected: IvariableBind<IapiMcpTool>;
    isOfflineAi: IvariableBind<boolean>;
    isOfflineMcp: IvariableBind<boolean>;
    adUrl: IvariableBind<string>;
    agentMode: IvariableBind<string>;
}

export interface Imethod {
    onClickChipUpload: () => void;
    onClickChipTool: () => void;
    onClickToolName: (name: string) => void;
    onClickToolClose: () => void;
    onClickChipTask: () => void;
    onClickButtonMessageSend: () => void;
    onClickDropdownModel: () => void;
    onClickModelName: (name: string) => void;
    onClickRefreshPage: () => void;
    onClickAd: (event: Event) => void;
}

export interface IelementHook extends Record<string, Element | Element[]> {
    elementInputMessageSend: HTMLInputElement;
    elementContainerMessageReceive: HTMLElement;
    elementBottomLimit: HTMLElement;
}
