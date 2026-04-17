import { IvariableBind } from "@cimo/jsmvcfw/dist/src/Main.js";

export interface Idata {
    fileName?: string;
    pageNumber: number;
}

export interface Iresult {
    fileContent: string;
    pageTotal: number;
}

export interface Ivariable {
    fileContent: IvariableBind<string>;
    pageNumber: IvariableBind<number>;
    pageTotal: IvariableBind<number>;
}

export interface Imethod {
    onInputChangePage: (event: Event) => void;
}

export interface IelementHook extends Record<string, Element | Element[]> {}
