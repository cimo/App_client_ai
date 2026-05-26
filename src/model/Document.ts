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
    contentHtml: IvariableBind<string>;
    contentImage: IvariableBind<string>;
    pageNumber: IvariableBind<number>;
    pageTotal: IvariableBind<number>;
}

export interface Imethod {
    onInputChangePage: (event: KeyboardEvent) => void;
    onClickChangePage: (pageDifference: number) => void;
}

export interface IelementHook extends Record<string, Element | Element[]> {
    elementInputPageNumber: HTMLInputElement;
}
