import { IvariableBind } from "@cimo/jsmvcfw/dist/src/Main.js";

export interface Ivariable {
    mode: IvariableBind<string>;
    messageList: IvariableBind<string[]>;
    timeClose: IvariableBind<number>;
}

export interface Imethod {
    onClickClose: (event: Event) => void;
}

export interface IelementHook extends Record<string, Element | Element[]> {}
