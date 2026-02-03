import { IvariableBind } from "@cimo/jsmvcfw/dist/src/Main.js";

export interface IopenAiApiModel {
    id: string;
    object: string;
    owned_by: string;
}

export interface IopenAiApiResponseItem {
    tool_call_id: string;
    type?: string;
    name: string;
    arguments: string;
    output: string;
}

export interface IopenAiApiResponse {
    type: string;
    sequence_number: number;
    delta: string;
    item: IopenAiApiResponseItem;
    response: {
        id: string;
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
    mcpTool?: IopenAiApiResponseItem;
}

export interface IresponseBody {
    response: {
        stdout: string;
        stderr: string | Error;
    };
}

export interface Ivariable {
    modelList: IvariableBind<IopenAiApiModel[]>;
    modelSelected: IvariableBind<string>;
    chatHistory: IvariableBind<IchatInput[]>;
    chatMessage: IvariableBind<IchatMessage[]>;
    isOpenDialogModelList: IvariableBind<boolean>;
    isOffline: IvariableBind<boolean>;
    adUrl: IvariableBind<string>;
}

export interface Imethod {
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
