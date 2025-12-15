import { IvariableBind } from "@cimo/jsmvcfw/dist/src/Main.js";

export interface IlmStudioModel {
    id: string;
    object: string;
    owned_by: string;
}

export interface IresponseBody {
    response: {
        stdout: string;
        stderr: string | Error;
    };
}

export interface Ivariable {
    count: IvariableBind<number>;
    modelList: IvariableBind<IlmStudioModel[]>;
}

export interface Imethod {
    onClickCount: () => void;
    onClickButton: () => void;
}

export interface IelementHook extends Record<string, Element | Element[]> {
    elementInputMessage: HTMLInputElement;
    elementResultMessage: HTMLElement;
}
