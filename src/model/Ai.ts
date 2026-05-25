import { IvariableBind } from "@cimo/jsmvcfw/dist/src/Main.js";

export interface Ivariable {
    isOfflineAi: IvariableBind<boolean>;
    isOpenDropdownModelList: IvariableBind<boolean>;
    modelList: IvariableBind<string[]>;
    modelSelected: IvariableBind<string>;
    adUrl: IvariableBind<string>;
}

export interface Imethod {
    onClickDropdownModel: () => void;
    onClickModelName: (name: string) => void;
}

export interface IelementHook extends Record<string, Element | Element[]> {}
