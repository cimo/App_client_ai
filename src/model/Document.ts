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
    isLoadingWindow: IvariableBind<boolean>;
    isLoadingPage: IvariableBind<boolean>;
    isPageExist: IvariableBind<boolean>;
    htmlContent: IvariableBind<string>;
    imageContent: IvariableBind<string>;
    pageNumber: IvariableBind<number>;
    pageTotal: IvariableBind<number>;
}

export interface Imethod {
    onInputChangePage: (event: KeyboardEvent) => void;
    onClickChangePage: (event: Event, difference: number) => void;
}

export interface IelementHook extends Record<string, Element | Element[]> {
    elementInputPageNumber: HTMLInputElement;
}
