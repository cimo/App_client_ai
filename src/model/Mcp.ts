import { IvariableBind } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelChat from "./Chat";

export interface IapiLoginBody {
    username: string;
    password: string;
}

export interface IapiDocumentListBody {
    folderJoin: string;
}

export interface IapiDocumentReadBody {
    fileName: string;
}

export interface IapiDocumentDeleteBody {
    pathFile: string;
}

export interface IapiDocumentFolderCreateBody {
    folderName: string;
    folderJoin: string;
}

export interface IapiRagCheckBody {
    pathFile: string;
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
    name: string;
    surname: string;
    password: string;
}

export interface IapiSettingUpdateBody {
    id: number;
    llm: IsettingLlm[];
}

export interface IapiLlmToolResponse {
    name: string;
    argumentObject: Record<string, string>;
}

export interface IapiLlmTaskResponse {
    list: IapiLlmToolResponse[];
}

export interface IapiToolCallResponse {
    result: {
        content: [
            {
                type: string;
                text: string;
            }
        ];
    };
}

export interface IuserLoginSession {
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
    name: string;
    surname: string;
    password?: string;
}

export interface ItoolBody {
    tool_call_id: string;
    type: string;
    name: string;
    arguments: string;
    output: string;
}

export interface ItoolResult {
    name: string;
    result: unknown;
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
    target: string;
    description: string;
}

export interface IragSearch {
    citationList: IragCitation[];
    nodeList: IragNode[];
    graphList: IragRelation[];
}

export interface IdocumentParser {
    fileName: string;
    searchInput: string;
}

export interface IactionOperation {
    message: string;
    isComplete?: boolean;
    state?: string;
    pathFile?: string;
}

export interface IfileDetail {
    fileName: string;
    extension: string;
    category: string;
    dateModified: string;
    size: string;
}

export interface IsettingLlm {
    id: number;
    name: string;
    module: string;
    url: string;
    apiKey: string;
    selected: boolean;
}

export interface Isetting {
    id: number;
    llm: IsettingLlm[];
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
    skillList: IvariableBind<IfileDetail[]>;
    user: IvariableBind<Iuser>;
    setting: IvariableBind<Isetting>;
    playwrightVideoSrc: IvariableBind<string>;
    playwrightVideoName: IvariableBind<string>;
    isDocumentUpload: IvariableBind<boolean>;
    isRagStart: IvariableBind<boolean>;
    isSkillUpload: IvariableBind<boolean>;
    agentForm: IvariableBind<Iagent>;
    isAgentSave: IvariableBind<boolean>;
    isUserUpdate: IvariableBind<boolean>;
    settingLlmServiceId: IvariableBind<number>;
    isSettingSave: IvariableBind<boolean>;
    systemMode: IvariableBind<string>;
    messageList: IvariableBind<modelChat.IdataMessage[]>;
}

export interface Imethod {
    onClickChipClose: () => void;
}

export interface IelementHook extends Record<string, Element | Element[]> {}
