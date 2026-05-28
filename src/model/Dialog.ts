import { IvariableBind } from "@cimo/jsmvcfw/dist/src/Main.js";

export interface Idata {
    mode: string;
    message: string;
    isConfirm: boolean;
}

export interface Ivariable {
    mode: IvariableBind<string>;
    message: IvariableBind<string>;
    isConfirm: IvariableBind<boolean>;
}

export interface Imethod {
    onClickOk(): void;
    onClickCancel(): void;
}

export interface IelementHook extends Record<string, Element | Element[]> {}
