import { IvariableBind } from "@cimo/jsmvcfw/dist/src/Main.js";

interface Imodel {
    id: string;
    object: string;
    owned_by: string;
}

export interface IapiModelResponse {
    data: Imodel[];
}

export interface Ivariable {
    isOfflineAi: IvariableBind<boolean>;
    isOpenDropdownModelList: IvariableBind<boolean>;
    modelList: IvariableBind<Imodel[]>;
    modelSelected: IvariableBind<string>;
    adUrl: IvariableBind<string>;
}

export interface Imethod {
    onClickDropdownModel: () => void;
    onClickModelName: (name: string) => void;
}

export interface IelementHook extends Record<string, Element | Element[]> {}
