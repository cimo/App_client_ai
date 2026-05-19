import { IvariableBind } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelMcp from "../model/Mcp";

export interface Ivariable {
    isMenuItemDocument: IvariableBind<boolean>;
    isMenuItemTool: IvariableBind<boolean>;
    isMenuItemTask: IvariableBind<boolean>;
    isMenuItemAgent: IvariableBind<boolean>;
    isMenuItemSkill: IvariableBind<boolean>;
    documentList: IvariableBind<string[]>;
    skillList: IvariableBind<string[]>;
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
    agentInputSystem: IvariableBind<string>;
}

export interface Imethod {
    onClickMenuDocument: () => void;
    onClickChipDocumentUpload: () => void;
    onClickDocumentDelete: (event: Event, index: number, fileName: string) => void;
    onClickMenuSkill: () => void;
    onClickChipSkillUpload: () => void;
    onClickSkillDelete: (event: Event, index: number, fileName: string) => void;
    onClickSelectSkill: (event: Event) => void;
    onClickSkillItem: (event: Event, fileName: string) => void;
    onClickSelectSkillCancel: (event: Event) => void;
    onClickMenuTool: () => void;
    onClickTool: (name: string) => void;
    onClickMenuTask: () => void;
    onClickTask: (name: string) => void;
    onClickMenuAgent: () => void;
    onClickAgentCreate: (event: Event) => void;
    onClickAgentEdit: (event: Event, id: number) => void;
    onClickAgentDelete: (event: Event, index: number, id: number) => void;
    onClickAgentSave: (event: Event) => void;
    onClickAgentCancel: (event: Event) => void;
    onClickAgent: (id: number) => void;
    openDocument: (title: string) => void;
}

export interface IelementHook extends Record<string, Element | Element[]> {
    elementInputAgentName: HTMLInputElement;
    elementInputAgentDescription: HTMLInputElement;
}
