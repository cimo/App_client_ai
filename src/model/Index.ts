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

export interface IlmStudioChatHistory {
    role: string;
    content: string;
}

export interface IchatMessage {
    time: string;
    user: string;
    assistantThink: string;
    assistantNoThink: string;
}

export interface IresponseBody {
    response: {
        stdout: string;
        stderr: string | Error;
    };
}

export interface Ivariable {
    modelList: IvariableBind<IlmStudioModel[]>;
    chatHistory: IvariableBind<IlmStudioChatHistory[]>;
    chatMessage: IvariableBind<IchatMessage[]>;
}

export interface Imethod {
    onClickButtonMessageSend: () => void;
}

export interface IelementHook extends Record<string, Element | Element[]> {
    elementInputMessageSend: HTMLInputElement;
    elementContainerMessageReceive: HTMLElement;
    elementBottomLimit: HTMLElement;
}
