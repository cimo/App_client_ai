import { IvariableBind } from "@cimo/jsmvcfw/dist/src/Main.js";

export interface Ivariable {
    pageNumber: IvariableBind<number>;
    pageTotal: IvariableBind<number>;
}

export interface Imethod {
    onClickChangePage: (index: number) => void;
    onInputChangePage: (event: KeyboardEvent) => void;
}

export interface IelementHook extends Record<string, Element | Element[]> {
    elementInputPageNumber: HTMLInputElement;
}
