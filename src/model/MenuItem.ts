import { IvariableBind } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelMcp from "../model/Mcp";

export interface Iagent {
    [key: string]: modelMcp.Iagent[];
}

export interface Ivariable {
    isMenuItemDocument: IvariableBind<boolean>;
    isMenuItemTool: IvariableBind<boolean>;
    isMenuItemTask: IvariableBind<boolean>;
    isMenuItemAgent: IvariableBind<boolean>;
    isMenuItemSkill: IvariableBind<boolean>;
    isMenuItemUser: IvariableBind<boolean>;
    isMenuItemSetting: IvariableBind<boolean>;
    documentList: IvariableBind<modelMcp.IfileDetail[]>;
    documentOpenList: IvariableBind<string[]>;
    documentSelectList: IvariableBind<string[]>;
    documentCurrentFolderList: IvariableBind<string[]>;
    isUploadRunning: IvariableBind<boolean>;
    isDeleteRunning: IvariableBind<boolean>;
    isDocumentFolderStillCreate: IvariableBind<boolean>;
    isDocumentFolderCreateRunning: IvariableBind<boolean>;
    isDocumentFolderMoveSelecting: IvariableBind<boolean>;
    isDocumentFolderMoveRunning: IvariableBind<boolean>;
    isRagRunning: IvariableBind<boolean>;
    isRagGraphOpen: IvariableBind<boolean>;
    isRagGraphHtmlLoading: IvariableBind<boolean>;
    ragGraphHtml: IvariableBind<string>;
    skillList: IvariableBind<modelMcp.IfileDetail[]>;
    skillSelectList: IvariableBind<string[]>;
    toolList: IvariableBind<modelMcp.Itool[]>;
    toolSelected: IvariableBind<modelMcp.Itool>;
    taskList: IvariableBind<modelMcp.Itask[]>;
    taskSelected: IvariableBind<modelMcp.Itask>;
    agentList: IvariableBind<modelMcp.Iagent[]>;
    agentSelected: IvariableBind<modelMcp.Iagent>;
    agentForm: IvariableBind<modelMcp.Iagent>;
    isAgentSkillSelect: IvariableBind<boolean>;
    isAgentSave: IvariableBind<boolean>;
    user: IvariableBind<modelMcp.Iuser>;
    isUserUpdate: IvariableBind<boolean>;
    setting: IvariableBind<modelMcp.Isetting>;
    settingLlmServiceId: IvariableBind<number>;
    isSettingSave: IvariableBind<boolean>;
    systemMode: IvariableBind<string>;
    pageNumber: IvariableBind<number>;
}

export interface Imethod {
    itemId: (key: string) => number;
    selectAllCheck: (mode: string) => boolean;
    itemPathSelected: (mode: string, fileName: string) => string;
    checkProcessOngoing: (mode: string) => boolean;
    onClickCheckbox: (mode: string, fileName: string) => void;
    onClickMenuDocument: () => void;
    onClickDocumentUpload: () => void;
    onClickDocumentDelete: (fileName: string) => void;
    onClickDocumentDeleteSelected: () => void;
    onClickDocumentFolderCreate: () => void;
    onClickDocumentFolderBack: () => void;
    onClickDocumentFolderMoveTo: () => void;
    onClickDocumentFolderHere: () => void;
    onClickDocumentOpen: (fileName: string, category: string) => void;
    onClickRagStart: () => void;
    onClickRagGraph: () => void;
    onClickRagGraphBack: () => void;
    onClickMenuSkill: () => void;
    onClickSkillUpload: () => void;
    onClickSkillDelete: (fileName: string) => void;
    onClickSkillDeleteSelected: () => void;
    onClickSelectSkill: () => void;
    onClickSkillSelect: (fileName: string) => void;
    onClickSelectSkillBack: () => void;
    onClickMenuTool: () => void;
    onClickToolOpen: (name: string) => void;
    onClickMenuTask: () => void;
    onClickTaskOpen: (name: string) => void;
    onClickMenuAgent: () => void;
    onClickAgentCreate: () => void;
    onClickAgentEdit: (id: number) => void;
    onClickAgentDelete: (index: number, id: number, name: string) => void;
    onClickAgentSave: () => void;
    onClickAgentCancel: () => void;
    onClickAgentOpen: (id: number) => void;
    onClickMenuUser: () => void;
    onClickUserUpdate: () => void;
    onClickUserCancel: () => void;
    onClickMenuSetting: () => Promise<void>;
    onChangeSettingLlmServiceId: () => void;
    onClickSettingSave: () => void;
    onClickSettingCancel: () => void;
    onClickToggleSelectAll: (mode: string) => void;
    onInputDocumentFolderName: (event: KeyboardEvent) => void;
}

export interface IelementHook extends Record<string, Element | Element[]> {
    elementInputDocumentFolderName: HTMLInputElement;
    elementInputAgentName: HTMLInputElement;
    elementInputAgentDescription: HTMLInputElement;
    elementInputUserName: HTMLInputElement;
    elementInputUserSurname: HTMLInputElement;
    elementInputUserPassword: HTMLInputElement;
    elementSelectSettingLlmServiceId: HTMLSelectElement;
    elementInputSettingLlmUrl: HTMLInputElement;
    elementInputSettingLlmApiKey: HTMLInputElement;
}
