import { IvariableBind } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelMcp from "../model/Mcp";

export interface IagentObject {
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
    isDocumentUpload: IvariableBind<boolean>;
    documentList: IvariableBind<modelMcp.IfileDetail[]>;
    documentOpenList: IvariableBind<string[]>;
    documentSelectList: IvariableBind<string[]>;
    isRagEmbeddingStart: IvariableBind<boolean>;
    isRagGraphOpen: IvariableBind<boolean>;
    isRagGraphHtmlLoading: IvariableBind<boolean>;
    ragGraphHtml: IvariableBind<string>;
    skillList: IvariableBind<modelMcp.IfileDetail[]>;
    skillSelectList: IvariableBind<string[]>;
    isSkillUpload: IvariableBind<boolean>;
    toolList: IvariableBind<modelMcp.Itool[]>;
    toolSelected: IvariableBind<modelMcp.Itool>;
    taskList: IvariableBind<modelMcp.Itask[]>;
    taskSelected: IvariableBind<modelMcp.Itask>;
    agentList: IvariableBind<modelMcp.Iagent[]>;
    agentSelected: IvariableBind<modelMcp.Iagent>;
    agentForm: IvariableBind<modelMcp.Iagent>;
    isAgentSkillSelect: IvariableBind<boolean>;
    isAgentSave: IvariableBind<boolean>;
    userInfo: IvariableBind<modelMcp.Iuser>;
    isUserUpdate: IvariableBind<boolean>;
    settingInfo: IvariableBind<modelMcp.Isetting>;
    isSettingSave: IvariableBind<boolean>;
    systemMode: IvariableBind<string>;
    pageNumber: IvariableBind<number>;
}

export interface Imethod {
    onClickMenuDocument: () => void;
    onClickDocumentUpload: () => void;
    onClickDocumentCheckbox: (fileName: string) => void;
    onClickDocumentDelete: (fileName: string) => void;
    onClickDocumentDeleteSelected: () => void;
    onClickRagStart: () => void;
    onClickRagGraph: () => void;
    onClickRagGraphBack: () => void;
    onClickMenuSkill: () => void;
    onClickSkillUpload: () => void;
    onClickSkillCheckbox: (fileName: string) => void;
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
    onClickMenuSetting: () => void;
    onClickSettingSave: () => void;
    onClickSettingCancel: () => void;
    windowOpenDocument: (title: string) => void;
}

export interface IelementHook extends Record<string, Element | Element[]> {
    elementInputAgentName: HTMLInputElement;
    elementInputAgentDescription: HTMLInputElement;
    elementInputUserEmail: HTMLInputElement;
    elementInputUserPassword: HTMLInputElement;
    elementSelectSettingApiId: HTMLSelectElement;
}
