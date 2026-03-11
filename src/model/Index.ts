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

export interface IapiAiResponseTool {
    tool_call_id: string;
    type: string;
    name: string;
    arguments: string;
    output: string;
}

export interface IapiAiResponse {
    type: string;
    response: {
        id: string;
        message: string;
    };
    error: {
        message: string;
    };
    delta: string;
    item: IapiAiResponseTool;
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
    mcpTool?: IapiAiResponseTool;
    file: string;
}

export interface Ivariable {
    isOfflineAi: IvariableBind<boolean>;
    isOfflineMcp: IvariableBind<boolean>;
    modelList: IvariableBind<IapiAiModel[]>;
    chatMessageList: IvariableBind<IchatMessage[]>;
    chatHistoryList: IvariableBind<IchatInput[]>;
    toolList: IvariableBind<IapiMcpTool[]>;
    isOpenDropdownModelList: IvariableBind<boolean>;
    modelSelected: IvariableBind<string>;
    isOpenDropdownToolList: IvariableBind<boolean>;
    toolSelected: IvariableBind<IapiMcpTool>;
    adUrl: IvariableBind<string>;
    systemMode: IvariableBind<string>;
    isMessageSent: IvariableBind<boolean>;
    isMenuItemFile: IvariableBind<boolean>;
    isMenuItemTool: IvariableBind<boolean>;
    isMenuItemTask: IvariableBind<boolean>;
    isMenuItemAgent: IvariableBind<boolean>;
    fileUploadedList: IvariableBind<string[]>;
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
    onClickMenuFile: () => void;
    onClickMenuTool: () => void;
    onClickMenuTask: () => void;
    onClickMenuAgent: () => void;
    onClickFileUploadDelete: (index: number, fileName: string) => void;
}

export interface IelementHook extends Record<string, Element | Element[]> {
    elementInputMessageSend: HTMLInputElement;
    elementContainerMessageReceive: HTMLElement;
    elementBottomLimit: HTMLElement;
}
