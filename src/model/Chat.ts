import { IvariableBind } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelMcp from "./Mcp";
import type Chat from "../controller/Chat.js";

export type TllmInstance = {
    modelAvailableList: string[];
    apiModel: (isShowDropdown: boolean) => Promise<void>;
    apiResponse: () => Promise<void>;
    apiCliLogin: (code?: string) => Promise<void>;
    apiCliResponse: () => Promise<void>;
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
    documentParserList: modelMcp.Idocument[];
    documentParserTabIndex: number;
    playwright: Iplaywright;
    llmAuthenticationUrl: string;
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
    message: string;
}

export interface Ivariable {
    isMessageSendAvailable: IvariableBind<boolean>;
    messageList: IvariableBind<IdataMessage[]>;
    systemMode: IvariableBind<string>;
    llmInstance: IvariableBind<TllmInstance | null>;
    isLoginLlm: IvariableBind<boolean>;
    isOfflineAi: IvariableBind<boolean>;
    isOpenDropdownModelList: IvariableBind<boolean>;
    modelList: IvariableBind<string[]>;
    modelSelected: IvariableBind<string>;
    isOfflineMcp: IvariableBind<boolean>;
    isLogin: IvariableBind<boolean>;
    toolSelected: IvariableBind<modelMcp.Itool>;
    toolList: IvariableBind<modelMcp.Itool[]>;
    taskSelected: IvariableBind<modelMcp.Itask>;
    agentSelected: IvariableBind<modelMcp.Iagent>;
    playwrightVideoSrc: IvariableBind<string>;
    playwrightVideoName: IvariableBind<string>;
    setting: IvariableBind<modelMcp.Isetting>;
    settingLlmServiceId: IvariableBind<number>;
    settingLlmUsageId: IvariableBind<number>;
}

export interface Imethod {
    onClickButtonMessageSend: () => void;
    onClickCitationLink: (event: Event, fileName: string, chunk: string) => void;
    onClickCitationTab: (messageIndex: number, tabIndex: number) => void;
    onClickDocumentParserTab: (messageIndex: number, tabIndex: number) => void;
    onClickPlaywrightVideoShow: (fileName: string) => void;
    onClickButtonLlmLogin: () => void;
    onClickLlmLoginCopyUrl: (url: string) => void;
    onClickLlmLoginOpenUrl: (url: string) => void;
    onErrorPlaywrightVideoFail: () => void;
    markdownHtml: (value: string) => string;
}

export interface IelementHook extends Record<string, Element | Element[]> {
    elementInputMessageSend: HTMLInputElement;
    elementContainerMessageReceive: HTMLElement;
    elementBottomLimit: HTMLElement;
    elementMessageStreamReasonWrapper: HTMLElement;
    elementMessageStreamReason: HTMLPreElement;
    elementMessageStreamNoReason: HTMLPreElement;
}
