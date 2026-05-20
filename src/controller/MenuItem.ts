import { Icontroller, IvirtualNode, variableBind, variableLink } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as helperSrc from "../HelperSrc";
import * as modelMenuItem from "../model/MenuItem";
import * as modelMcp from "../model/Mcp";
import * as viewMenuItem from "../view/MenuItem";
import type Mcp from "./Mcp";

export default class MenuItem implements Icontroller {
    // Variable
    private variableObject: modelMenuItem.Ivariable;
    private methodObject: modelMenuItem.Imethod;
    private controllerMcp: Mcp;

    // Method
    private onClickMenuDocument = (): void => {
        this.controllerMcp.apiDocumentList().then(() => {
            this.variableObject.isMenuItemDocument.state = !this.variableObject.isMenuItemDocument.state;
            this.variableObject.isMenuItemTool.state = false;
            this.variableObject.isMenuItemTask.state = false;
            this.variableObject.isMenuItemAgent.state = false;
            this.variableObject.isMenuItemSkill.state = false;

            this.variableObject.agentForm.state = {} as modelMcp.Iagent;
            this.variableObject.isAgentSelectSkill.state = false;
        });
    };

    private onClickChipDocumentUpload = async (): Promise<void> => {
        await this.controllerMcp.apiDocumentUpload();
    };

    private onClickDocumentDelete = (event: Event, index: number, fileName: string): void => {
        event.stopPropagation();

        this.controllerMcp.apiDocumentDelete(index, fileName);
    };

    private onClickMenuSkill = (): void => {
        this.controllerMcp.apiSkillList().then(() => {
            this.variableObject.isMenuItemDocument.state = false;
            this.variableObject.isMenuItemTool.state = false;
            this.variableObject.isMenuItemTask.state = false;
            this.variableObject.isMenuItemAgent.state = false;
            this.variableObject.isMenuItemSkill.state = !this.variableObject.isMenuItemSkill.state;

            this.variableObject.agentForm.state = {} as modelMcp.Iagent;
            this.variableObject.isAgentSelectSkill.state = false;
        });
    };

    private onClickChipSkillUpload = async (): Promise<void> => {
        await this.controllerMcp.apiSkillUpload();
    };

    private onClickSkillDelete = (event: Event, index: number, fileName: string): void => {
        event.stopPropagation();

        this.controllerMcp.apiSkillDelete(index, fileName);
    };

    private onClickSelectSkill = (event: Event): void => {
        event.stopPropagation();

        this.controllerMcp.apiSkillList().then(() => {
            this.variableObject.agentForm.state.name = this.hookObject.elementInputAgentName.value;
            this.variableObject.agentForm.state.description = this.hookObject.elementInputAgentDescription.value;

            this.variableObject.isAgentSelectSkill.state = true;
        });
    };

    private onClickSkillItem = (event: Event, fileName: string): void => {
        event.stopPropagation();

        this.variableObject.agentForm.state.skill = fileName;

        this.variableObject.isAgentSelectSkill.state = false;
    };

    private onClickSelectSkillCancel = (event: Event): void => {
        event.stopPropagation();

        this.variableObject.isAgentSelectSkill.state = false;
    };

    private onClickMenuTool = (): void => {
        this.variableObject.isMenuItemDocument.state = false;
        this.variableObject.isMenuItemTool.state = !this.variableObject.isMenuItemTool.state;
        this.variableObject.isMenuItemTask.state = false;
        this.variableObject.isMenuItemAgent.state = false;
        this.variableObject.isMenuItemSkill.state = false;

        this.variableObject.agentForm.state = {} as modelMcp.Iagent;
        this.variableObject.isAgentSelectSkill.state = false;
    };

    private onClickTool = (name: string): void => {
        this.variableObject.toolSelected.state = {} as modelMcp.Itool;
        this.variableObject.taskSelected.state = {} as modelMcp.Itask;
        this.variableObject.agentSelected.state = {} as modelMcp.Iagent;

        for (const tool of this.variableObject.toolList.state) {
            if (tool.name === name) {
                this.variableObject.toolSelected.state = tool;

                this.variableObject.isMenuItemTool.state = false;

                break;
            }
        }

        this.variableObject.systemMode.state = "tool-call";
    };

    private onClickMenuTask = (): void => {
        this.variableObject.isMenuItemDocument.state = false;
        this.variableObject.isMenuItemTool.state = false;
        this.variableObject.isMenuItemTask.state = !this.variableObject.isMenuItemTask.state;
        this.variableObject.isMenuItemAgent.state = false;
        this.variableObject.isMenuItemSkill.state = false;

        this.variableObject.agentForm.state = {} as modelMcp.Iagent;
        this.variableObject.isAgentSelectSkill.state = false;
    };

    private onClickTask = (name: string): void => {
        this.variableObject.toolSelected.state = {} as modelMcp.Itool;
        this.variableObject.taskSelected.state = {} as modelMcp.Itask;
        this.variableObject.agentSelected.state = {} as modelMcp.Iagent;

        for (const task of this.variableObject.taskList.state) {
            if (task.name === name) {
                this.variableObject.taskSelected.state = task;

                this.variableObject.isMenuItemTask.state = false;

                break;
            }
        }

        this.variableObject.systemMode.state = "task-call";
    };

    private onClickMenuAgent = (): void => {
        this.controllerMcp.apiAgentList().then(() => {
            this.variableObject.isMenuItemDocument.state = false;
            this.variableObject.isMenuItemTool.state = false;
            this.variableObject.isMenuItemTask.state = false;
            this.variableObject.isMenuItemAgent.state = !this.variableObject.isMenuItemAgent.state;
            this.variableObject.isMenuItemSkill.state = false;

            this.variableObject.agentForm.state = {} as modelMcp.Iagent;
            this.variableObject.isAgentSelectSkill.state = false;
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
        this.variableObject.agentFormResult.state = "";
    };

    private onClickAgentEdit = (event: Event, id: number): void => {
        event.stopPropagation();

        for (const agent of this.variableObject.agentList.state) {
            if (agent.id === id) {
                this.variableObject.agentForm.state = agent;

                break;
            }
        }

        this.variableObject.agentFormResult.state = "";
    };

    private onClickAgentDelete = (event: Event, index: number, id: number): void => {
        event.stopPropagation();

        this.controllerMcp.apiAgentDelete(index, id);
    };

    private onClickAgentSave = (event: Event): void => {
        event.stopPropagation();

        if (this.hookObject.elementInputAgentName.value === "") {
            this.variableObject.agentFormResult.state = "Agent name is required.";
        } else if (this.variableObject.agentForm.state.skill === "") {
            this.variableObject.agentFormResult.state = "Agent skill is required.";
        } else {
            this.variableObject.agentFormResult.state = "";
        }

        if (this.variableObject.agentFormResult.state === "") {
            this.variableObject.agentForm.state.name = this.hookObject.elementInputAgentName.value;
            this.variableObject.agentForm.state.description = this.hookObject.elementInputAgentDescription.value;

            if (this.variableObject.agentForm.state.id === -1) {
                this.controllerMcp.apiAgentCreate(this.variableObject.agentForm.state);
            } else {
                this.controllerMcp.apiAgentUpdate(this.variableObject.agentForm.state);
            }
        }
    };

    private onClickAgentCancel = (event: Event): void => {
        event.stopPropagation();

        this.controllerMcp.apiAgentList().then(() => {
            this.variableObject.agentForm.state = {} as modelMcp.Iagent;
        });
    };

    private onClickAgent = async (id: number): Promise<void> => {
        this.variableObject.toolSelected.state = {} as modelMcp.Itool;
        this.variableObject.taskSelected.state = {} as modelMcp.Itask;
        this.variableObject.agentSelected.state = {} as modelMcp.Iagent;
        this.variableObject.agentInputSystem.state = "";

        for (const agent of this.variableObject.agentList.state) {
            if (agent.id === id) {
                this.variableObject.agentSelected.state = agent;

                this.variableObject.isMenuItemAgent.state = false;

                break;
            }
        }

        const skillContent = await this.controllerMcp.apiSkillRead(this.variableObject.agentSelected.state.skill);

        if (skillContent) {
            this.variableObject.agentInputSystem.state = window.atob(skillContent);

            this.variableObject.systemMode.state = "agent-skill";
        }
    };

    private openDocument = async (title: string): Promise<void> => {
        await helperSrc.openWindow("document", title, "#/document");
    };

    setControllerMcp(controller: Mcp): void {
        this.controllerMcp = controller;
    }

    constructor() {
        this.variableObject = {} as modelMenuItem.Ivariable;
        this.methodObject = {} as modelMenuItem.Imethod;

        this.controllerMcp = {} as Mcp;
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
                documentList: variableLink<string[]>("Mcp"),
                skillList: variableLink<string[]>("Mcp"),
                toolList: variableLink<modelMcp.Itool[]>("Mcp"),
                toolSelected: variableLink<modelMcp.Itool>("Mcp"),
                taskList: variableLink<modelMcp.Itask[]>("Mcp"),
                taskSelected: variableLink<modelMcp.Itask>("Mcp"),
                agentList: variableLink<modelMcp.Iagent[]>("Mcp"),
                agentSelected: variableLink<modelMcp.Iagent>("Mcp"),
                agentForm: {} as modelMcp.Iagent,
                agentFormResult: "",
                isAgentSelectSkill: false,
                systemMode: variableLink<string>("Chat"),
                agentInputSystem: variableLink<string>("Chat")
            },
            this.constructor.name
        );

        this.methodObject = {
            onClickMenuDocument: this.onClickMenuDocument,
            onClickChipDocumentUpload: this.onClickChipDocumentUpload,
            onClickDocumentDelete: this.onClickDocumentDelete,
            onClickMenuSkill: this.onClickMenuSkill,
            onClickChipSkillUpload: this.onClickChipSkillUpload,
            onClickSkillDelete: this.onClickSkillDelete,
            onClickSelectSkill: this.onClickSelectSkill,
            onClickSkillItem: this.onClickSkillItem,
            onClickSelectSkillCancel: this.onClickSelectSkillCancel,
            onClickMenuTool: this.onClickMenuTool,
            onClickTool: this.onClickTool,
            onClickMenuTask: this.onClickMenuTask,
            onClickTask: this.onClickTask,
            onClickMenuAgent: this.onClickMenuAgent,
            onClickAgentCreate: this.onClickAgentCreate,
            onClickAgentEdit: this.onClickAgentEdit,
            onClickAgentDelete: this.onClickAgentDelete,
            onClickAgentSave: this.onClickAgentSave,
            onClickAgentCancel: this.onClickAgentCancel,
            onClickAgent: this.onClickAgent,
            openDocument: this.openDocument
        };
    }

    variableEffect(): void {}

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
