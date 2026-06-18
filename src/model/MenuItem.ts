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
}

export interface Imethod {
    onClickMenuDocument: (event: Event) => void;
    onClickDocumentUpload: () => void;
    onClickDocumentCheckbox: (event: Event, fileName: string) => void;
    onClickDocumentDelete: (event: Event, fileName: string) => void;
    onClickDocumentDeleteSelected: (event: Event) => void;
    onClickRagStart: () => void;
    onClickRagGraph: () => void;
    onClickRagGraphBack: (event: Event) => void;
    onClickMenuSkill: (event: Event) => void;
    onClickSkillUpload: () => void;
    onClickSkillCheckbox: (event: Event, fileName: string) => void;
    onClickSkillDelete: (event: Event, fileName: string) => void;
    onClickSkillDeleteSelected: (event: Event) => void;
    onClickSelectSkill: (event: Event) => void;
    onClickSkillSelect: (event: Event, fileName: string) => void;
    onClickSelectSkillBack: (event: Event) => void;
    onClickMenuTool: (event: Event) => void;
    onClickToolOpen: (name: string) => void;
    onClickMenuTask: (event: Event) => void;
    onClickTaskOpen: (name: string) => void;
    onClickMenuAgent: (event: Event) => void;
    onClickAgentCreate: (event: Event) => void;
    onClickAgentEdit: (event: Event, id: number) => void;
    onClickAgentDelete: (event: Event, index: number, id: number, name: string) => void;
    onClickAgentSave: (event: Event) => void;
    onClickAgentCancel: (event: Event) => void;
    onClickAgentOpen: (id: number) => void;
    onClickMenuUser: (event: Event) => void;
    onClickUserUpdate: (event: Event) => void;
    onClickUserCancel: (event: Event) => void;
    onClickMenuSetting: (event: Event) => void;
    onClickSettingSave: (event: Event) => void;
    onClickSettingCancel: (event: Event) => void;
    windowOpenDocument: (title: string) => void;
}

export interface IelementHook extends Record<string, Element | Element[]> {
    elementInputAgentName: HTMLInputElement;
    elementInputAgentDescription: HTMLInputElement;
    elementInputUserEmail: HTMLInputElement;
    elementInputUserPassword: HTMLInputElement;
    elementSelectSettingApiId: HTMLSelectElement;
}
