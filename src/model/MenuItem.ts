import { IvariableBind } from "@cimo/jsmvcfw/dist/src/Main.js";

export interface Ivariable {
    isMenuItemFile: IvariableBind<boolean>;
    isMenuItemTool: IvariableBind<boolean>;
    isMenuItemTask: IvariableBind<boolean>;
    isMenuItemAgent: IvariableBind<boolean>;
    fileUploadedList: IvariableBind<string[]>;
}

export interface Imethod {
    onClickMenuFile: () => void;
    onClickMenuTool: () => void;
    onClickMenuTask: () => void;
    onClickMenuAgent: () => void;
    onClickFileUploadDelete: (index: number, fileName: string) => void;
}

export interface IelementHook extends Record<string, Element | Element[]> {}
