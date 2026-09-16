import { IvariableBind } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelChat from "./Chat";

export interface IapiLoginBody {
    mode: string;
    username?: string;
    password?: string;
}

export interface IapiWorkspaceBody {
    folderJoin: string;
}

export interface IapiWorkspaceReadBody {
    fileName: string;
}

export interface IapiWorkspaceDeleteBody {
    pathList: string[];
}

export interface IapiWorkspaceRenameBody {
    pathItem: string;
    name: string;
}

export interface IapiWorkspaceFolderCreateBody {
    folderName: string;
    folderJoin: string;
}

export interface IapiWorkspaceFolderMoveBody {
    pathList: string[];
    folderJoin: string;
}

export interface IapiRagCheckBody {
    pathFile: string;
}

export interface IapiSkillReadBody {
    fileName: string;
}

export interface IapiSkillDeleteBody {
    fileNameList: string[];
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
    llmList: IsettingLlm[];
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
    message: string;
}

export interface IdocumentParser {
    fileName: string;
    searchInput: string;
    message: string;
}

export interface IitemDetail {
    name: string;
    baseName: string;
    size: string;
    dateModified: string;
    extension: string;
    category: string;
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
    llmList: IsettingLlm[];
}

export interface Ivariable {
    adUrl: IvariableBind<string>;
    loginMode: IvariableBind<string>;
    isOfflineMcp: IvariableBind<boolean>;
    isLogin: IvariableBind<boolean>;
    toolList: IvariableBind<Itool[]>;
    toolSelected: IvariableBind<Itool>;
    taskList: IvariableBind<Itask[]>;
    taskSelected: IvariableBind<Itask>;
    agentList: IvariableBind<Iagent[]>;
    agentSelected: IvariableBind<Iagent>;
    workspaceItemList: IvariableBind<IitemDetail[]>;
    skillList: IvariableBind<IitemDetail[]>;
    user: IvariableBind<Iuser>;
    setting: IvariableBind<Isetting>;
    playwrightVideoSrc: IvariableBind<string>;
    playwrightVideoName: IvariableBind<string>;
    isRagRunning: IvariableBind<boolean>;
    agentData: IvariableBind<Iagent>;
    settingLlmServiceId: IvariableBind<number>;
    systemMode: IvariableBind<string>;
    messageList: IvariableBind<modelChat.IdataMessage[]>;
}

export interface Imethod {
    onClickChipClose: () => void;
}

export interface IelementHook extends Record<string, Element | Element[]> {}
