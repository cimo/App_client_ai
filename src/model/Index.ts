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

export interface IresponseBody {
    response: {
        stdout: string;
        stderr: string | Error;
    };
}

export interface Ivariable {
    modelList: IvariableBind<IlmStudioModel[]>;
    modelResponseThink: IvariableBind<string>;
    modelResponseNoThink: IvariableBind<string>;
    messageSendCopy: IvariableBind<string>;
    messageSendCopyTime: IvariableBind<string>;
}

export interface Imethod {
    onClickButtonMessageSend: () => void;
}

export interface IelementHook extends Record<string, Element | Element[]> {
    elementInputMessageSend: HTMLInputElement;
}
