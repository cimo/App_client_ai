import { IvariableBind } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelChat from "./Chat";

export interface IapiLoginBody {
    username: string;
    password: string;
}

export interface IapiDocumentReadBody {
    pageNumber: number;
    fileName: string;
}

export interface IapiDocumentDeleteBody {
    fileName: string;
}

export interface IapiRagEmbeddingCheckBody {
    fileName: string;
}

export interface IapiSkillReadBody {
    fileName: string;
}

export interface IapiSkillDeleteBody {
    fileName: string;
}

export interface IapiAgentCreateBody {
    name: string;
    description: string;
    skillName: string;
}

export interface IapiAgentUpdateBody {
    id: number;
    name: string;
    description: string;
    skillName: string;
}

export interface IapiAgentDeleteBody {
    id: number;
}

export interface IapiUserUpdateBody {
    id: number;
    email: string;
    password: string;
}

export interface IapiSettingUpdateBody {
    id: number;
    apiId: number;
}

export interface IloginSession {
    mcpSessionId: string;
    message: string;
}

export interface Itool {
    name: string;
    argumentObject: Record<string, unknown>;
    icon: string;
    description: string;
    example: string;
    inputInstruction: string;
}

export interface Itask {
    name: string;
    argumentObject: Record<string, unknown>;
    icon: string;
    description: string;
    example: string;
    inputInstruction: string;
}

export interface Iagent {
    id: number;
    name: string;
    description: string;
    skillName: string;
}

export interface Iuser {
    id: number;
    email: string;
    password?: string;
}

export interface Isetting {
    id: number;
    apiId: number;
}

export interface IragCitation {
    fileName: string;
    chunk: string;
    distance: number;
}

export interface IragNode {
    name: string;
    type: string;
    description: string;
}

export interface IragRelation {
    source: string;
    verb: string;
    target: string;
    description: string;
    chunk: string;
}

export interface IragSearch {
    citationList: IragCitation[];
    nodeList: IragNode[];
    graphList: IragRelation[];
}

export interface IdocumentParser {
    fileName: string;
    resultExecute: string;
}

export interface IfileStatus {
    fileName: string;
    status: string;
}

export interface IfileDetail {
    fileName: string;
    dateModified: string;
    size: string;
}

export interface IllmResponseTool {
    name: string;
    result: unknown;
}

export interface Ivariable {
    isOfflineMcp: IvariableBind<boolean>;
    isLogin: IvariableBind<boolean>;
    toolList: IvariableBind<Itool[]>;
    toolSelected: IvariableBind<Itool>;
    taskList: IvariableBind<Itask[]>;
    taskSelected: IvariableBind<Itask>;
    agentList: IvariableBind<Iagent[]>;
    agentSelected: IvariableBind<Iagent>;
    documentList: IvariableBind<IfileDetail[]>;
    isDocumentUpload: IvariableBind<boolean>;
    isRagEmbeddingStart: IvariableBind<boolean>;
    skillList: IvariableBind<IfileDetail[]>;
    isSkillUpload: IvariableBind<boolean>;
    agentForm: IvariableBind<Iagent>;
    isAgentSave: IvariableBind<boolean>;
    userInfo: IvariableBind<Iuser>;
    isUserUpdate: IvariableBind<boolean>;
    settingInfo: IvariableBind<Isetting>;
    isSettingSave: IvariableBind<boolean>;
    systemMode: IvariableBind<string>;
    chatMessageList: IvariableBind<modelChat.IchatMessage[]>;
    playwrightVideoSrc: IvariableBind<string>;
    playwrightVideoName: IvariableBind<string>;
}

export interface Imethod {
    onClickChipClose: () => void;
}

export interface IelementHook extends Record<string, Element | Element[]> {}
