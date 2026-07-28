import { IvariableBind } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelMcp from "./Mcp";
import type Chat from "../controller/Chat.js";

export type TllmInstance = {
    apiModel: (isShowDropdown: boolean) => Promise<void>;
    apiResponse: () => Promise<void>;
};

export type TllmConstructor = new (chat: Chat) => TllmInstance;

export interface IdataMessage {
    isLoading: boolean;
    time: string;
    user: string;
    assistantReason: string;
    assistantNoReason: string;
    mcpToolBody?: modelMcp.ItoolBody;
    ragCitationList: modelMcp.IragCitation[] | undefined;
    ragCitationTabIndex: number;
    securityScanner: string;
    playwright: Iplaywright;
}

export interface Ifile {
    [key: string]: {
        searchInput: string;
    };
}

export interface Iplaywright {
    action: string;
    nameList: string[];
    stdout: string;
}

export interface Ivariable {
    isMessageSendAvailable: IvariableBind<boolean>;
    messageList: IvariableBind<IdataMessage[]>;
    systemMode: IvariableBind<string>;
    llmInstance: IvariableBind<TllmInstance | null>;
    isOpenDropdownModelList: IvariableBind<boolean>;
    modelList: IvariableBind<string[]>;
    modelSelected: IvariableBind<string>;
    toolSelected: IvariableBind<modelMcp.Itool>;
    toolList: IvariableBind<modelMcp.Itool[]>;
    taskSelected: IvariableBind<modelMcp.Itask>;
    agentSelected: IvariableBind<modelMcp.Iagent>;
    playwrightVideoSrc: IvariableBind<string>;
    playwrightVideoName: IvariableBind<string>;
    setting: IvariableBind<modelMcp.Isetting>;
}

export interface Imethod {
    onClickButtonMessageSend: () => void;
    onClickCitationLink: (event: Event, fileName: string, chunk: string) => void;
    onClickCitationTab: (messageIndex: number, tabIndex: number) => void;
    onClickPlaywrightVideoShow: (fileName: string) => void;
    onErrorPlaywrightVideoFail: () => void;
}

export interface IelementHook extends Record<string, Element | Element[]> {
    elementInputMessageSend: HTMLInputElement;
    elementContainerMessageReceive: HTMLElement;
    elementBottomLimit: HTMLElement;
    elementMessageStreamReasonWrapper: HTMLElement;
    elementMessageStreamReason: HTMLPreElement;
    elementMessageStreamNoReason: HTMLPreElement;
}
