import { IvariableBind } from "@cimo/jsmvcfw/dist/src/Main.js";

export interface IlmStudioApiModel {
    id: string;
    object: string;
    owned_by: string;
}

export interface IlmStudioApiResponseItem {
    type?: string;
    name: string;
    arguments: string;
    output: string;
}

export interface IlmStudioApiResponse {
    type: string;
    delta: string;
    item: IlmStudioApiResponseItem;
}

export interface IchatHistory {
    role: string;
    content: string | Array<{ type: string; text?: string; image_url?: string }>;
}

export interface IchatMessage {
    time: string;
    user: string;
    assistantReason: string;
    assistantNoReason: string;
    mcpTool?: IlmStudioApiResponseItem;
}

export interface IresponseBody {
    response: {
        stdout: string;
        stderr: string | Error;
    };
}

export interface Ivariable {
    modelList: IvariableBind<IlmStudioApiModel[]>;
    modelSelected: IvariableBind<string>;
    chatHistory: IvariableBind<IchatHistory[]>;
    chatMessage: IvariableBind<IchatMessage[]>;
    isOpenDialogModelList: IvariableBind<boolean>;
    isOffline: IvariableBind<boolean>;
}

export interface Imethod {
    onClickButtonMessageSend: () => void;
    onClickButtonModel: () => void;
    onClickModelName: (name: string) => void;
    onClickRefreshPage: () => void;
}

export interface IelementHook extends Record<string, Element | Element[]> {
    elementInputMessageSend: HTMLInputElement;
    elementContainerMessageReceive: HTMLElement;
    elementBottomLimit: HTMLElement;
}
