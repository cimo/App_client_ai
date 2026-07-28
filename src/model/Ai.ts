import { IvariableBind } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelMcp from "./Mcp.js";
import * as modelChat from "./Chat.js";

export interface Ivariable {
    isOfflineAi: IvariableBind<boolean>;
    isOpenDropdownModelList: IvariableBind<boolean>;
    modelList: IvariableBind<string[]>;
    modelSelected: IvariableBind<string>;
    adUrl: IvariableBind<string>;
    setting: IvariableBind<modelMcp.Isetting>;
    llmInstance: IvariableBind<modelChat.TllmInstance | null>;
}

export interface Imethod {
    onClickDropdownModel: () => void;
    onClickModelName: (name: string) => void;
}

export interface IelementHook extends Record<string, Element | Element[]> {}
