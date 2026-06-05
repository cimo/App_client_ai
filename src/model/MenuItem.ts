import { IvariableBind } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelMcp from "../model/Mcp";

export interface Ivariable {
    isMenuItemDocument: IvariableBind<boolean>;
    isMenuItemTool: IvariableBind<boolean>;
    isMenuItemTask: IvariableBind<boolean>;
    isMenuItemAgent: IvariableBind<boolean>;
    isMenuItemSkill: IvariableBind<boolean>;
    isDocumentUpload: IvariableBind<boolean>;
    documentList: IvariableBind<modelMcp.IfileDetail[]>;
    documentOpenList: IvariableBind<string[]>;
    isRagEmbeddingStart: IvariableBind<boolean>;
    isRagGraphOpen: IvariableBind<boolean>;
    skillList: IvariableBind<modelMcp.IfileDetail[]>;
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
    systemMode: IvariableBind<string>;
}

export interface Imethod {
    onClickMenuDocument: (event: Event) => void;
    onClickChipDocumentUpload: () => void;
    onClickDocumentDelete: (event: Event, index: number, fileName: string) => void;
    onClickChipRagStart: () => void;
    onClickChipRagGraph: () => void;
    onClickRagGraphBack: (event: Event) => void;
    onClickMenuSkill: (event: Event) => void;
    onClickChipSkillUpload: () => void;
    onClickSkillDelete: (event: Event, index: number, fileName: string) => void;
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
    windowOpenDocument: (title: string) => void;
    fileExtension: (fileName: string) => string;
}

export interface IelementHook extends Record<string, Element | Element[]> {
    elementInputAgentName: HTMLInputElement;
    elementInputAgentDescription: HTMLInputElement;
}
