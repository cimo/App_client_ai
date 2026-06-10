import { IvariableBind } from "@cimo/jsmvcfw/dist/src/Main.js";

export interface IresponseBody {
    response: {
        stdout: string;
        stderr: string | Error;
    };
}

export interface Ivariable {
    adUrl: IvariableBind<string>;
    isOfflineAi: IvariableBind<boolean>;
    isOfflineMcp: IvariableBind<boolean>;
    isViewHidden: IvariableBind<boolean>;
}

export interface Imethod {
    onClickAd: (event: Event) => void;
    onClickRefreshPage: () => void;
}

export interface IelementHook extends Record<string, Element | Element[]> {}
