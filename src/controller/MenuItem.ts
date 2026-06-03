import { Icontroller, IvariableEffect, IvirtualNode, variableBind, variableLink } from "@cimo/jsmvcfw/dist/src/Main.js";
import { getAllWindows } from "@tauri-apps/api/window";

// Source
import * as helperSrc from "../HelperSrc";
import * as modelMenuItem from "../model/MenuItem";
import * as modelMcp from "../model/Mcp";
import * as viewMenuItem from "../view/MenuItem";
import type Mcp from "./Mcp";
import type Toast from "./Toast";
import ControllerDialog from "./Dialog";

export default class MenuItem implements Icontroller {
    // Variable
    private variableObject: modelMenuItem.Ivariable;
    private methodObject: modelMenuItem.Imethod;
    private controllerMcp: Mcp;
    private controllerToast: Toast;
    private controllerDialog: ControllerDialog;

    // Method
    private onClickMenuDocument = (event: Event): void => {
        event.stopPropagation();

        this.controllerMcp.apiDocumentList().then(() => {
            this.variableObject.isMenuItemDocument.state = !this.variableObject.isMenuItemDocument.state;
            this.variableObject.isMenuItemTool.state = false;
            this.variableObject.isMenuItemTask.state = false;
            this.variableObject.isMenuItemAgent.state = false;
            this.variableObject.isMenuItemSkill.state = false;

            this.variableObject.agentForm.state = {} as modelMcp.Iagent;
            this.variableObject.isAgentSkillSelect.state = false;
        });
    };

    private onClickChipDocumentUpload = async (): Promise<void> => {
        await this.controllerMcp.apiDocumentUpload();
    };

    private onClickDocumentDelete = async (event: Event, index: number, fileName: string): Promise<void> => {
        event.stopPropagation();

        const isConfirm = await this.controllerDialog.show("warning", `Are you sure you want to delete: '${fileName}'?`, false);

        if (isConfirm) {
            const windowLabel = helperSrc.windowLabelUnique("document", fileName);
            const windowList = await getAllWindows();

            for (let a = 0; a < windowList.length; a++) {
                const window = windowList[a];

                if (window.label === windowLabel) {
                    await window.close();

                    break;
                }
            }

            this.controllerMcp.apiDocumentDelete(index, fileName);
        }
    };

    private onClickChipRagStart = async (): Promise<void> => {
        await this.controllerMcp.apiRagEmbeddingStart();
    };

    private onClickChipRagGraph = async (): Promise<void> => {
        this.variableObject.isRagGraphOpen.state = true;
    };

    private onClickRagGraphBack = (event: Event): void => {
        event.stopPropagation();

        this.variableObject.isRagGraphOpen.state = false;
    };

    private onClickMenuSkill = (event: Event): void => {
        event.stopPropagation();

        this.controllerMcp.apiSkillList().then(() => {
            this.variableObject.isMenuItemDocument.state = false;
            this.variableObject.isMenuItemTool.state = false;
            this.variableObject.isMenuItemTask.state = false;
            this.variableObject.isMenuItemAgent.state = false;
            this.variableObject.isMenuItemSkill.state = !this.variableObject.isMenuItemSkill.state;

            this.variableObject.agentForm.state = {} as modelMcp.Iagent;
            this.variableObject.isAgentSkillSelect.state = false;
        });
    };

    private onClickChipSkillUpload = async (): Promise<void> => {
        await this.controllerMcp.apiSkillUpload();
    };

    private onClickSkillDelete = async (event: Event, index: number, fileName: string): Promise<void> => {
        event.stopPropagation();

        this.controllerMcp.apiAgentList().then(async (resultApiList) => {
            let agentList = [];
            let agentNameList = [];

            for (let a = 0; a < resultApiList.length; a++) {
                if (resultApiList[a].skill === fileName) {
                    agentList.push(resultApiList[a]);
                    agentNameList.push(resultApiList[a].name);
                }
            }

            let dialogMessage = `Are you sure you want to delete: '${fileName}'?`;

            if (agentList.length > 0) {
                dialogMessage =
                    `Skill is being used by the agent: ${agentNameList.join(", ")}. ` +
                    "If you delete the skill, it will be removed in the agent. " +
                    dialogMessage;
            }

            const isConfirm = await this.controllerDialog.show("warning", dialogMessage, false);

            if (isConfirm) {
                this.controllerMcp.apiSkillDelete(index, fileName);

                for (let a = 0; a < agentList.length; a++) {
                    const agent = agentList[a];

                    agent.skill = "";

                    this.controllerMcp.apiAgentUpdate(agent);

                    this.unselectAgent(agent.id);
                }
            }
        });
    };

    private onClickSelectSkill = (event: Event): void => {
        event.stopPropagation();

        this.controllerMcp.apiSkillList().then(() => {
            this.variableObject.agentForm.state.name = this.hookObject.elementInputAgentName.value;
            this.variableObject.agentForm.state.description = this.hookObject.elementInputAgentDescription.value;

            this.variableObject.isAgentSkillSelect.state = true;
        });
    };

    private onClickSkillSelect = (event: Event, fileName: string): void => {
        event.stopPropagation();

        this.variableObject.agentForm.state.skill = fileName;

        this.variableObject.isAgentSkillSelect.state = false;
    };

    private onClickSelectSkillBack = (event: Event): void => {
        event.stopPropagation();

        this.variableObject.isAgentSkillSelect.state = false;
    };

    private onClickMenuTool = (event: Event): void => {
        event.stopPropagation();

        this.variableObject.isMenuItemDocument.state = false;
        this.variableObject.isMenuItemTool.state = !this.variableObject.isMenuItemTool.state;
        this.variableObject.isMenuItemTask.state = false;
        this.variableObject.isMenuItemAgent.state = false;
        this.variableObject.isMenuItemSkill.state = false;

        this.variableObject.agentForm.state = {} as modelMcp.Iagent;
        this.variableObject.isAgentSkillSelect.state = false;
    };

    private onClickToolOpen = (name: string): void => {
        this.variableObject.toolSelected.state = {} as modelMcp.Itool;
        this.variableObject.taskSelected.state = {} as modelMcp.Itask;
        this.variableObject.agentSelected.state = {} as modelMcp.Iagent;

        for (let a = 0; a < this.variableObject.toolList.state.length; a++) {
            const tool = this.variableObject.toolList.state[a];

            if (tool.name === name) {
                this.variableObject.toolSelected.state = tool;

                this.variableObject.isMenuItemTool.state = false;

                break;
            }
        }

        this.variableObject.systemMode.state = "tool-call";
    };

    private onClickMenuTask = (event: Event): void => {
        event.stopPropagation();

        this.variableObject.isMenuItemDocument.state = false;
        this.variableObject.isMenuItemTool.state = false;
        this.variableObject.isMenuItemTask.state = !this.variableObject.isMenuItemTask.state;
        this.variableObject.isMenuItemAgent.state = false;
        this.variableObject.isMenuItemSkill.state = false;

        this.variableObject.agentForm.state = {} as modelMcp.Iagent;
        this.variableObject.isAgentSkillSelect.state = false;
    };

    private onClickTaskOpen = (name: string): void => {
        this.variableObject.toolSelected.state = {} as modelMcp.Itool;
        this.variableObject.taskSelected.state = {} as modelMcp.Itask;
        this.variableObject.agentSelected.state = {} as modelMcp.Iagent;

        for (let a = 0; a < this.variableObject.taskList.state.length; a++) {
            const task = this.variableObject.taskList.state[a];

            if (task.name === name) {
                this.variableObject.taskSelected.state = task;

                this.variableObject.isMenuItemTask.state = false;

                break;
            }
        }

        this.variableObject.systemMode.state = "task-call";
    };

    private onClickMenuAgent = (event: Event): void => {
        event.stopPropagation();

        this.controllerMcp.apiAgentList().then(() => {
            this.variableObject.isMenuItemDocument.state = false;
            this.variableObject.isMenuItemTool.state = false;
            this.variableObject.isMenuItemTask.state = false;
            this.variableObject.isMenuItemAgent.state = !this.variableObject.isMenuItemAgent.state;
            this.variableObject.isMenuItemSkill.state = false;

            this.variableObject.agentForm.state = {} as modelMcp.Iagent;
            this.variableObject.isAgentSkillSelect.state = false;
        });
    };

    private onClickAgentCreate = (event: Event): void => {
        event.stopPropagation();

        this.variableObject.agentForm.state = {
            id: -1,
            name: "",
            description: "",
            skill: ""
        };
    };

    private onClickAgentEdit = (event: Event, id: number): void => {
        event.stopPropagation();

        for (let a = 0; a < this.variableObject.agentList.state.length; a++) {
            const agent = this.variableObject.agentList.state[a];

            if (agent.id === id) {
                this.variableObject.agentForm.state = agent;

                break;
            }
        }
    };

    private onClickAgentDelete = async (event: Event, index: number, id: number, name: string): Promise<void> => {
        event.stopPropagation();

        const isConfirm = await this.controllerDialog.show("warning", `Are you sure you want to delete: '${name}'?`, false);

        if (isConfirm) {
            this.controllerMcp.apiAgentDelete(index, id);

            this.unselectAgent(id);
        }
    };

    private onClickAgentSave = (event: Event): void => {
        event.stopPropagation();

        const errorList = [];

        if (this.hookObject.elementInputAgentName.value === "") {
            errorList.push("Agent name is required.");
        }

        if (this.hookObject.elementInputAgentDescription.value === "") {
            errorList.push("Agent description is required.");
        }

        if (this.variableObject.agentForm.state.skill === "") {
            errorList.push("Agent skill is required.");
        }

        if (errorList.length === 0) {
            this.variableObject.agentForm.state.name = this.hookObject.elementInputAgentName.value;
            this.variableObject.agentForm.state.description = this.hookObject.elementInputAgentDescription.value;

            if (this.variableObject.agentForm.state.id === -1) {
                this.controllerMcp.apiAgentCreate(this.variableObject.agentForm.state);
            } else {
                this.controllerMcp.apiAgentUpdate(this.variableObject.agentForm.state);
            }
        } else {
            this.controllerToast.show("error", errorList);
        }
    };

    private onClickAgentCancel = (event: Event): void => {
        event.stopPropagation();

        this.controllerMcp.apiAgentList().then(() => {
            this.variableObject.agentForm.state = {} as modelMcp.Iagent;
        });
    };

    private onClickAgentOpen = async (id: number): Promise<void> => {
        this.variableObject.toolSelected.state = {} as modelMcp.Itool;
        this.variableObject.taskSelected.state = {} as modelMcp.Itask;
        this.variableObject.agentSelected.state = {} as modelMcp.Iagent;

        for (let a = 0; a < this.variableObject.agentList.state.length; a++) {
            const agent = this.variableObject.agentList.state[a];

            if (agent.id === id) {
                if (agent.skill === "") {
                    await this.controllerDialog.show(
                        "info",
                        `Agent '${agent.name}' does not have a selected skill. Please select a skill to use this agent.`,
                        true
                    );
                } else {
                    this.variableObject.agentSelected.state = agent;

                    this.variableObject.isMenuItemAgent.state = false;

                    this.variableObject.systemMode.state = "agent-skill";
                }

                break;
            }
        }
    };

    private openDocument = async (title: string): Promise<void> => {
        const route = "#/document";

        await helperSrc.windowOpen("document", title, route, {
            title,
            url: route,
            decorations: true,
            resizable: true,
            width: 750,
            height: 1000,
            minWidth: 750,
            minHeight: 1050,
            center: true,
            focus: true
        });
    };

    private fileExtension = (fileName: string): string => {
        const fileDetail = helperSrc.fileDetail(fileName);

        return fileDetail.extension;
    };

    private unselectAgent = (id: number): void => {
        if (this.variableObject.agentSelected.state.id === id) {
            this.variableObject.agentSelected.state = {} as modelMcp.Iagent;

            this.variableObject.systemMode.state = "chat";
        }
    };

    setControllerMcp(controller: Mcp): void {
        this.controllerMcp = controller;
    }

    setControllerToast(controller: Toast): void {
        this.controllerToast = controller;
    }

    constructor() {
        this.variableObject = {} as modelMenuItem.Ivariable;
        this.methodObject = {} as modelMenuItem.Imethod;

        this.controllerMcp = {} as Mcp;
        this.controllerToast = {} as Toast;
        this.controllerDialog = new ControllerDialog();
    }

    hookObject = {} as modelMenuItem.IelementHook;

    variable(): void {
        this.variableObject = variableBind(
            {
                isMenuItemDocument: false,
                isMenuItemTool: false,
                isMenuItemTask: false,
                isMenuItemAgent: false,
                isMenuItemSkill: false,
                documentList: variableLink<modelMcp.IfileDetail[]>("Mcp"),
                isDocumentUpload: false,
                isRagEmbeddingStart: false,
                isRagGraphOpen: false,
                skillList: variableLink<modelMcp.IfileDetail[]>("Mcp"),
                isSkillUpload: false,
                toolList: variableLink<modelMcp.Itool[]>("Mcp"),
                toolSelected: variableLink<modelMcp.Itool>("Mcp"),
                taskList: variableLink<modelMcp.Itask[]>("Mcp"),
                taskSelected: variableLink<modelMcp.Itask>("Mcp"),
                agentList: variableLink<modelMcp.Iagent[]>("Mcp"),
                agentSelected: variableLink<modelMcp.Iagent>("Mcp"),
                agentForm: {} as modelMcp.Iagent,
                isAgentSkillSelect: false,
                isAgentSave: false,
                systemMode: variableLink<string>("Chat")
            },
            this.constructor.name
        );

        this.methodObject = {
            onClickMenuDocument: this.onClickMenuDocument,
            onClickChipDocumentUpload: this.onClickChipDocumentUpload,
            onClickDocumentDelete: this.onClickDocumentDelete,
            onClickChipRagStart: this.onClickChipRagStart,
            onClickChipRagGraph: this.onClickChipRagGraph,
            onClickRagGraphBack: this.onClickRagGraphBack,
            onClickMenuSkill: this.onClickMenuSkill,
            onClickChipSkillUpload: this.onClickChipSkillUpload,
            onClickSkillDelete: this.onClickSkillDelete,
            onClickSelectSkill: this.onClickSelectSkill,
            onClickSkillSelect: this.onClickSkillSelect,
            onClickSelectSkillBack: this.onClickSelectSkillBack,
            onClickMenuTool: this.onClickMenuTool,
            onClickToolOpen: this.onClickToolOpen,
            onClickMenuTask: this.onClickMenuTask,
            onClickTaskOpen: this.onClickTaskOpen,
            onClickMenuAgent: this.onClickMenuAgent,
            onClickAgentCreate: this.onClickAgentCreate,
            onClickAgentEdit: this.onClickAgentEdit,
            onClickAgentDelete: this.onClickAgentDelete,
            onClickAgentSave: this.onClickAgentSave,
            onClickAgentCancel: this.onClickAgentCancel,
            onClickAgentOpen: this.onClickAgentOpen,
            openDocument: this.openDocument,
            fileExtension: this.fileExtension
        };
    }

    variableEffect(watch: IvariableEffect): void {
        watch([]);
    }

    view(name?: string): IvirtualNode {
        if (name === "left") {
            return viewMenuItem.left(this.variableObject, this.methodObject);
        } else if (name === "right") {
            return viewMenuItem.right(this.variableObject, this.methodObject);
        }

        throw new Error(`Unsupported view: ${String(name)}`);
    }

    event(): void {}

    subControllerList(): Icontroller[] {
        const list: Icontroller[] = [];

        return list;
    }

    rendered(): void {}

    destroy(): void {}
}
