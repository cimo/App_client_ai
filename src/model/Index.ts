import { IvariableBind } from "@cimo/jsmvcfw/dist/src/Main.js";

interface IlmStudioChatCompletionChoices {
    delta: {
        content: string;
    };
    finish_reason: string;
    index: number;
    logprobs: string;
}

export interface IlmStudioModel {
    id: string;
    object: string;
    owned_by: string;
}

export interface IlmStudioChatCompletion {
    choices: IlmStudioChatCompletionChoices[];
    created: number;
    id: string;
    model: string;
    object: string;
    system_fingerprint: string;
}

export interface IlmStudioResponseItem {
    type?: string;
    name: string;
    arguments: string;
    output: string;
}

export interface IlmStudioResponse {
    type: string;
    delta: string;
    item: IlmStudioResponseItem;
}

export interface IchatHistory {
    role: string;
    content: string | Array<{ type: string; text: string }>;
}

export interface IchatMessage {
    time: string;
    user: string;
    assistantThink: string;
    assistantNoThink: string;
    mcpTool?: IlmStudioResponseItem;
}

export interface IresponseBody {
    response: {
        stdout: string;
        stderr: string | Error;
    };
}

export interface Ivariable {
    modelList: IvariableBind<IlmStudioModel[]>;
    chatHistory: IvariableBind<IchatHistory[]>;
    chatMessage: IvariableBind<IchatMessage[]>;
    isOpenDialogModelList: IvariableBind<boolean>;
    isOffline: IvariableBind<boolean>;
}

export interface Imethod {
    onClickButtonMessageSend: () => void;
    onClickButtonModelList: () => void;
    onClickModelName: (name: string) => void;
    onClickRefreshPage: () => void;
}

export interface IelementHook extends Record<string, Element | Element[]> {
    elementInputMessageSend: HTMLInputElement;
    elementContainerMessageReceive: HTMLElement;
    elementBottomLimit: HTMLElement;
}
