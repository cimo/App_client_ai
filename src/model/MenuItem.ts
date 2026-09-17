import { IvariableBind } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelMcp from "../model/Mcp";

export interface Iagent {
    [key: string]: modelMcp.Iagent[];
}

export interface Ivariable {
    loginMode: IvariableBind<string>;
    isLogin: IvariableBind<boolean>;
    isOfflineMcp: IvariableBind<boolean>;
    isMenuItemWorkspace: IvariableBind<boolean>;
    isMenuItemTool: IvariableBind<boolean>;
    isMenuItemTask: IvariableBind<boolean>;
    isMenuItemAgent: IvariableBind<boolean>;
    isMenuItemSkill: IvariableBind<boolean>;
    isMenuItemUser: IvariableBind<boolean>;
    isMenuItemSetting: IvariableBind<boolean>;
    documentOpenList: IvariableBind<string[]>;
    workspaceItemList: IvariableBind<modelMcp.IitemDetail[]>;
    workspaceSelectList: IvariableBind<string[]>;
    workspaceCurrentFolderList: IvariableBind<string[]>;
    workspaceRenameSelected: IvariableBind<string>;
    isUploadRunning: IvariableBind<boolean>;
    isDeleteRunning: IvariableBind<boolean>;
    isWorkspaceFolderStillCreate: IvariableBind<boolean>;
    isWorkspaceFolderCreateRunning: IvariableBind<boolean>;
    isWorkspaceFolderMoveSelecting: IvariableBind<boolean>;
    isWorkspaceFolderMoveRunning: IvariableBind<boolean>;
    isRagRunning: IvariableBind<boolean>;
    isRagGraphOpen: IvariableBind<boolean>;
    isRagGraphHtmlLoading: IvariableBind<boolean>;
    ragGraphHtml: IvariableBind<string>;
    skillList: IvariableBind<modelMcp.IitemDetail[]>;
    skillSelectList: IvariableBind<string[]>;
    toolList: IvariableBind<modelMcp.Itool[]>;
    toolSelected: IvariableBind<modelMcp.Itool>;
    taskList: IvariableBind<modelMcp.Itask[]>;
    taskSelected: IvariableBind<modelMcp.Itask>;
    agentList: IvariableBind<modelMcp.Iagent[]>;
    agentSelected: IvariableBind<modelMcp.Iagent>;
    agentData: IvariableBind<modelMcp.Iagent>;
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
    selectAllCheck: (mode: string) => boolean;
    checkProcessOngoing: (mode: string) => boolean;
    checkRenameSelected: (itemDetail: modelMcp.IitemDetail) => boolean;
    checkItemSelected: (itemDetail: modelMcp.IitemDetail) => boolean;
    itemId: (key: string) => number;
    onClickCheckbox: (mode: string, itemDetail: modelMcp.IitemDetail) => void;
    onClickMenuWorkspace: () => void;
    onClickWorkspaceUpload: () => void;
    onClickWorkspaceDeleteItem: (itemDetail: modelMcp.IitemDetail) => void;
    onClickWorkspaceDeleteSelected: () => void;
    onClickWorkspaceRename: (event: Event, itemDetail: modelMcp.IitemDetail) => void;
    onClickWorkspaceFolderCreate: () => void;
    onClickWorkspaceFolderBack: () => void;
    onClickWorkspaceFolderMoveTo: () => void;
    onClickWorkspaceFolderHere: () => void;
    onClickWorkspaceOpen: (fileName: string, category: string) => void;
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
    onClickSettingSave: () => void;
    onClickSettingCancel: () => void;
    onClickMenuSetting: () => Promise<void>;
    onClickToggleSelectAll: (mode: string) => void;
    onInputWorkspaceFolderName: (event: KeyboardEvent) => void;
    onInputWorkspaceRename: (event: KeyboardEvent) => void;
    onChangeSettingLlmServiceId: () => void;
}

export interface IelementHook extends Record<string, Element | Element[]> {
    elementInputWorkspaceFolderName: HTMLInputElement;
    elementInputWorkspaceRename: HTMLInputElement;
    elementInputAgentName: HTMLInputElement;
    elementInputAgentDescription: HTMLInputElement;
    elementInputUserName: HTMLInputElement;
    elementInputUserSurname: HTMLInputElement;
    elementInputUserPassword: HTMLInputElement;
    elementSelectSettingLlmServiceId: HTMLSelectElement;
    elementInputSettingLlmUrl: HTMLInputElement;
    elementInputSettingLlmApiKey: HTMLInputElement;
}
