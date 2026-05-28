import { IvariableBind } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelMcp from "../model/Mcp";

export interface Ivariable {
    isMenuItemDocument: IvariableBind<boolean>;
    isMenuItemTool: IvariableBind<boolean>;
    isMenuItemTask: IvariableBind<boolean>;
    isMenuItemAgent: IvariableBind<boolean>;
    isMenuItemSkill: IvariableBind<boolean>;
    documentList: IvariableBind<modelMcp.IfileDetail[]>;
    isDocumentUploading: IvariableBind<boolean>;
    documentUploadStatusList: IvariableBind<modelMcp.IfileStatus[]>;
    documentEmbeddingStatusList: IvariableBind<modelMcp.IfileStatus[]>;
    skillList: IvariableBind<modelMcp.IfileDetail[]>;
    isSkillUploading: IvariableBind<boolean>;
    skillUploadStatusList: IvariableBind<modelMcp.IfileStatus[]>;
    toolList: IvariableBind<modelMcp.Itool[]>;
    toolSelected: IvariableBind<modelMcp.Itool>;
    taskList: IvariableBind<modelMcp.Itask[]>;
    taskSelected: IvariableBind<modelMcp.Itask>;
    agentList: IvariableBind<modelMcp.Iagent[]>;
    agentSelected: IvariableBind<modelMcp.Iagent>;
    agentForm: IvariableBind<modelMcp.Iagent>;
    agentFormResult: IvariableBind<string>;
    isAgentSelectSkill: IvariableBind<boolean>;
    systemMode: IvariableBind<string>;
}

export interface Imethod {
    onClickMenuDocument: (event: Event) => void;
    onClickChipDocumentUpload: () => void;
    onClickDocumentDelete: (event: Event, index: number, fileName: string) => void;
    onClickMenuSkill: (event: Event) => void;
    onClickChipSkillUpload: () => void;
    onClickSkillDelete: (event: Event, index: number, fileName: string) => void;
    onClickSelectSkill: (event: Event) => void;
    onClickSkillItem: (event: Event, fileName: string) => void;
    onClickSelectSkillCancel: (event: Event) => void;
    onClickMenuTool: (event: Event) => void;
    onClickTool: (name: string) => void;
    onClickMenuTask: (event: Event) => void;
    onClickTask: (name: string) => void;
    onClickMenuAgent: (event: Event) => void;
    onClickAgentCreate: (event: Event) => void;
    onClickAgentEdit: (event: Event, id: number) => void;
    onClickAgentDelete: (event: Event, index: number, id: number, name: string) => void;
    onClickAgentSave: (event: Event) => void;
    onClickAgentCancel: (event: Event) => void;
    onClickAgent: (id: number) => void;
    openDocument: (title: string) => void;
    fileExtension: (fileName: string) => string;
}

export interface IelementHook extends Record<string, Element | Element[]> {
    elementInputAgentName: HTMLInputElement;
    elementInputAgentDescription: HTMLInputElement;
}
