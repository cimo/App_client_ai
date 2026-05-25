import { IvariableBind } from "@cimo/jsmvcfw/dist/src/Main.js";

export interface Ivariable {
    toastMessage: IvariableBind<string>;
    toastType: IvariableBind<string>;
}

export interface Imethod {}

export interface IelementHook extends Record<string, Element | Element[]> {}
