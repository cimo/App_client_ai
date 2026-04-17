import { IvariableBind } from "@cimo/jsmvcfw/dist/src/Main.js";

interface IapiModelItem {
    id: string;
    object: string;
    owned_by: string;
}

export interface IapiModel {
    data: IapiModelItem[];
}

export interface Ivariable {
    isOfflineAi: IvariableBind<boolean>;
    isOpenDropdownModelList: IvariableBind<boolean>;
    modelList: IvariableBind<IapiModelItem[]>;
    modelSelected: IvariableBind<string>;
    adUrl: IvariableBind<string>;
}

export interface Imethod {
    onClickDropdownModel: () => void;
    onClickModelName: (name: string) => void;
}

export interface IelementHook extends Record<string, Element | Element[]> {}
