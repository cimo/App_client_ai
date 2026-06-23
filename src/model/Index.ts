import { IvariableBind } from "@cimo/jsmvcfw/dist/src/Main.js";

export interface Ivariable {
    adUrl: IvariableBind<string>;
    isOfflineAi: IvariableBind<boolean>;
    isOfflineMcp: IvariableBind<boolean>;
    isLogin: IvariableBind<boolean>;
    isViewHidden: IvariableBind<boolean>;
}

export interface Imethod {
    onClickLoginBasic: () => void;
    onClickLoginAd: () => void;
    onClickRefreshPage: () => void;
}

export interface IelementHook extends Record<string, Element | Element[]> {
    elementInputUsername: HTMLInputElement;
    elementInputPassword: HTMLInputElement;
}
