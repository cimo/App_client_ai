import { IvariableBind } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelChat from "./Chat";

export interface Itool {
    name: string;
    argumentObject: Record<string, string>;
    icon: string;
    description: string;
}

export interface Itask {
    name: string;
    argumentObject: Record<string, string>;
    icon: string;
    description: string;
}

export interface Iagent {
    id: number;
    name: string;
    description: string;
    skill: string;
}

export interface IragCitation {
    fileName: string;
    citation: string;
}

export interface IragRelation {
    source: string;
    relation: string;
    target: string;
}

export interface IragSearch {
    citationList: IragCitation[];
    relationList: IragRelation[];
}

export interface IdocumentParser {
    fileName: string;
    terminalExecution: string;
}

export interface IfileStatus {
    fileName: string;
    status: string;
}

export interface IapiToolResponse {
    name: string;
    resultList: [];
}

export interface Ivariable {
    isOfflineMcp: IvariableBind<boolean>;
    toolList: IvariableBind<Itool[]>;
    toolSelected: IvariableBind<Itool>;
    taskList: IvariableBind<Itask[]>;
    taskSelected: IvariableBind<Itask>;
    agentList: IvariableBind<Iagent[]>;
    agentSelected: IvariableBind<Iagent>;
    documentList: IvariableBind<string[]>;
    isDocumentUploading: IvariableBind<boolean>;
    documentUploadStatusList: IvariableBind<IfileStatus[]>;
    documentEmbeddingStatusList: IvariableBind<IfileStatus[]>;
    skillList: IvariableBind<string[]>;
    isSkillUploading: IvariableBind<boolean>;
    skillUploadStatusList: IvariableBind<IfileStatus[]>;
    agentForm: IvariableBind<Iagent>;
    agentFormResult: IvariableBind<string>;
    systemMode: IvariableBind<string>;
    chatMessageList: IvariableBind<modelChat.IchatMessage[]>;
}

export interface Imethod {
    onClickChipClose: () => void;
}

export interface IelementHook extends Record<string, Element | Element[]> {}
