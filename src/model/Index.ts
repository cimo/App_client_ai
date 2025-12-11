import { IvariableBind } from "@cimo/jsmvcfw/dist/src/Main.js";

export interface Ivariable {
    count: IvariableBind<number>;
}

export interface Imethod {
    onClickCount: () => void;
    onClickButton: () => void;
}

export interface IelementHook extends Record<string, Element | Element[]> {
    elementInputMessage: HTMLInputElement;
    elementResultMessage: HTMLElement;
}
