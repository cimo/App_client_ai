import { IvariableBind } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelMcp from "./Mcp";
import * as modelChat from "./Chat.js";

export interface Ivariable {
    adUrl: IvariableBind<string>;
    isViewHidden: IvariableBind<boolean>;
    isOfflineAi: IvariableBind<boolean>;
    isOfflineMcp: IvariableBind<boolean>;
    isLogin: IvariableBind<boolean>;
    setting: IvariableBind<modelMcp.Isetting>;
    llmInstance: IvariableBind<modelChat.TllmInstance | null>;
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
