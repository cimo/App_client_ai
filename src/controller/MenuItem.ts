import { Icontroller, IvariableEffect, IvirtualNode, variableBind, variableLink } from "@cimo/jsmvcfw/dist/src/Main.js";
import { listen, UnlistenFn } from "@tauri-apps/api/event";

// Source
import * as helperSrc from "../HelperSrc";
import * as modelMenuItem from "../model/MenuItem";
import * as modelMcp from "../model/Mcp";
import * as modelDocument from "../model/Document";
import * as viewMenuItem from "../view/MenuItem";
import type Mcp from "./Mcp";
import type Toast from "./Toast";
import ControllerDialog from "./Dialog";
import ControllerPagination from "./Pagination";

export default class MenuItem implements Icontroller {
    // Variable
    private variableObject: modelMenuItem.Ivariable;
    private methodObject: modelMenuItem.Imethod;
    private controllerMcp: Mcp;
    private controllerToast: Toast;
    private controllerDialog: ControllerDialog;
    private controllerPagination: ControllerPagination;

    private unlistenWindowDocumentData: UnlistenFn | undefined = undefined;
    private unlistenWindowDocumentClose: UnlistenFn | undefined = undefined;

    // Method
    private paginationUpdate = async (mode: string, list?: modelMcp.IfileDetail[]): Promise<void> => {
        if (mode === "initialize" && list) {
            this.variableObject.pageNumber.state = 1;
        }

        if (this.variableObject.isMenuItemDocument.state) {
            let documentList = list;

            if (mode === "update") {
                documentList = await this.controllerMcp.apiDocumentSelect();
            }

            if (documentList) {
                this.variableObject.documentList.state = this.controllerPagination.updateList<modelMcp.IfileDetail>(documentList);
            }
        } else if (this.variableObject.isMenuItemSkill.state || this.variableObject.isAgentSkillSelect.state) {
            let skillList = list;

            if (mode === "update") {
                skillList = await this.controllerMcp.apiSkillSelect();
            }

            if (skillList) {
                this.variableObject.skillList.state = this.controllerPagination.updateList<modelMcp.IfileDetail>(skillList);
            }
        }
    };

    private selectAllCheck = (fileDetailList: modelMcp.IfileDetail[], selectList: string[]): boolean => {
        let isResult = true;

        for (const fileDetail of fileDetailList) {
            if (!selectList.includes(fileDetail.fileName)) {
                isResult = false;

                break;
            }
        }

        return isResult;
    };

    private onClickMenuDocument = (): void => {
        this.controllerMcp.apiDocumentSelect().then(() => {
            this.variableObject.isMenuItemDocument.state = !this.variableObject.isMenuItemDocument.state;
            this.variableObject.isMenuItemTool.state = false;
            this.variableObject.isMenuItemTask.state = false;
            this.variableObject.isMenuItemAgent.state = false;
            this.variableObject.isMenuItemSkill.state = false;
            this.variableObject.isMenuItemUser.state = false;
            this.variableObject.isMenuItemSetting.state = false;

            this.variableObject.agentForm.state = {} as modelMcp.Iagent;
            this.variableObject.isAgentSkillSelect.state = false;

            this.paginationUpdate("initialize", this.variableObject.documentList.state);
        });
    };

    private onClickDocumentUpload = async (): Promise<void> => {
        await this.controllerMcp.apiDocumentUpload();

        this.paginationUpdate("update");
    };

    private onClickDocumentCheckbox = (fileName: string): void => {
        if (!this.variableObject.documentSelectList.state.includes(fileName)) {
            this.variableObject.documentSelectList.state.push(fileName);
        } else {
            const selectedList = [];

            for (let a = 0; a < this.variableObject.documentSelectList.state.length; a++) {
                if (this.variableObject.documentSelectList.state[a] !== fileName) {
                    selectedList.push(this.variableObject.documentSelectList.state[a]);
                }
            }

            this.variableObject.documentSelectList.state = selectedList;
        }
    };

    private onClickDocumentDelete = (fileName: string): void => {
        if (!this.controllerDialog.getIsOpen()) {
            this.dialogMessageDeleteDocument(fileName);
        }
    };

    private onClickDocumentDeleteSelected = (): void => {
        if (!this.controllerDialog.getIsOpen()) {
            this.dialogMessageDeleteDocument();
        }
    };

    private onClickRagStart = (): void => {
        this.controllerMcp.apiRagEmbeddingStart();
    };

    private onClickRagGraph = async (): Promise<void> => {
        this.variableObject.isRagGraphOpen.state = true;

        this.variableObject.isRagGraphHtmlLoading.state = true;
        this.variableObject.ragGraphHtml.state = await this.controllerMcp.apiRagGraph();
        this.variableObject.isRagGraphHtmlLoading.state = false;
    };

    private onClickRagGraphBack = (): void => {
        this.variableObject.isRagGraphOpen.state = false;
    };

    private onClickMenuSkill = (): void => {
        this.controllerMcp.apiSkillSelect().then(() => {
            this.variableObject.isMenuItemDocument.state = false;
            this.variableObject.isMenuItemTool.state = false;
            this.variableObject.isMenuItemTask.state = false;
            this.variableObject.isMenuItemAgent.state = false;
            this.variableObject.isMenuItemSkill.state = !this.variableObject.isMenuItemSkill.state;
            this.variableObject.isMenuItemUser.state = false;
            this.variableObject.isMenuItemSetting.state = false;

            this.variableObject.agentForm.state = {} as modelMcp.Iagent;
            this.variableObject.isAgentSkillSelect.state = false;

            this.paginationUpdate("initialize", this.variableObject.skillList.state);
        });
    };

    private onClickSkillUpload = async (): Promise<void> => {
        await this.controllerMcp.apiSkillUpload();

        this.paginationUpdate("update");
    };

    private onClickSkillCheckbox = (fileName: string): void => {
        if (!this.variableObject.skillSelectList.state.includes(fileName)) {
            this.variableObject.skillSelectList.state.push(fileName);
        } else {
            const selectedList = [];

            for (let a = 0; a < this.variableObject.skillSelectList.state.length; a++) {
                if (this.variableObject.skillSelectList.state[a] !== fileName) {
                    selectedList.push(this.variableObject.skillSelectList.state[a]);
                }
            }

            this.variableObject.skillSelectList.state = selectedList;
        }
    };

    private onClickSkillDelete = (fileName: string): void => {
        if (!this.controllerDialog.getIsOpen()) {
            this.controllerMcp.apiAgentSelect().then((resultApiList) => {
                this.dialogMessageDeleteSkill(resultApiList, fileName);
            });
        }
    };

    private onClickSkillDeleteSelected = (): void => {
        if (!this.controllerDialog.getIsOpen()) {
            this.controllerMcp.apiAgentSelect().then((resultApiList) => {
                this.dialogMessageDeleteSkill(resultApiList);
            });
        }
    };

    private onClickSelectSkill = (): void => {
        this.controllerMcp.apiSkillSelect().then(() => {
            this.variableObject.agentForm.state.name = this.hookObject.elementInputAgentName.value;
            this.variableObject.agentForm.state.description = this.hookObject.elementInputAgentDescription.value;

            this.variableObject.isAgentSkillSelect.state = true;

            this.paginationUpdate("initialize", this.variableObject.skillList.state);
        });
    };

    private onClickSkillSelect = (fileName: string): void => {
        this.variableObject.agentForm.state.skillName = fileName;

        this.variableObject.isAgentSkillSelect.state = false;
    };

    private onClickSelectSkillBack = (): void => {
        this.variableObject.isAgentSkillSelect.state = false;
    };

    private onClickMenuTool = (): void => {
        this.variableObject.isMenuItemDocument.state = false;
        this.variableObject.isMenuItemTool.state = !this.variableObject.isMenuItemTool.state;
        this.variableObject.isMenuItemTask.state = false;
        this.variableObject.isMenuItemAgent.state = false;
        this.variableObject.isMenuItemSkill.state = false;
        this.variableObject.isMenuItemUser.state = false;
        this.variableObject.isMenuItemSetting.state = false;

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

    private onClickMenuTask = (): void => {
        this.variableObject.isMenuItemDocument.state = false;
        this.variableObject.isMenuItemTool.state = false;
        this.variableObject.isMenuItemTask.state = !this.variableObject.isMenuItemTask.state;
        this.variableObject.isMenuItemAgent.state = false;
        this.variableObject.isMenuItemSkill.state = false;
        this.variableObject.isMenuItemUser.state = false;
        this.variableObject.isMenuItemSetting.state = false;

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

    private onClickMenuAgent = (): void => {
        this.controllerMcp.apiAgentSelect().then(() => {
            this.variableObject.isMenuItemDocument.state = false;
            this.variableObject.isMenuItemTool.state = false;
            this.variableObject.isMenuItemTask.state = false;
            this.variableObject.isMenuItemAgent.state = !this.variableObject.isMenuItemAgent.state;
            this.variableObject.isMenuItemSkill.state = false;
            this.variableObject.isMenuItemUser.state = false;
            this.variableObject.isMenuItemSetting.state = false;

            this.variableObject.agentForm.state = {} as modelMcp.Iagent;
            this.variableObject.isAgentSkillSelect.state = false;
        });
    };

    private onClickAgentCreate = (): void => {
        this.variableObject.agentForm.state = {
            id: -1,
            name: "",
            description: "",
            skillName: ""
        };
    };

    private onClickAgentEdit = (id: number): void => {
        for (let a = 0; a < this.variableObject.agentList.state.length; a++) {
            const agent = this.variableObject.agentList.state[a];

            if (agent.id === id) {
                this.variableObject.agentForm.state = agent;

                break;
            }
        }
    };

    private onClickAgentDelete = async (index: number, id: number, name: string): Promise<void> => {
        const isConfirm = await this.controllerDialog.show("warning", `Are you sure you want to delete: '${name}'?`, false);

        if (isConfirm) {
            this.controllerMcp.apiAgentDelete(index, id);

            this.unselectAgent(id);
        }
    };

    private onClickAgentSave = (): void => {
        const errorList = [];

        if (this.hookObject.elementInputAgentName.value === "") {
            errorList.push("Agent name is required.");
        }

        if (this.hookObject.elementInputAgentDescription.value === "") {
            errorList.push("Agent description is required.");
        }

        if (this.variableObject.agentForm.state.skillName === "") {
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

    private onClickAgentCancel = (): void => {
        this.controllerMcp.apiAgentSelect().then(() => {
            this.variableObject.agentForm.state = {} as modelMcp.Iagent;
        });
    };

    private onClickAgentOpen = (id: number): void => {
        this.variableObject.toolSelected.state = {} as modelMcp.Itool;
        this.variableObject.taskSelected.state = {} as modelMcp.Itask;
        this.variableObject.agentSelected.state = {} as modelMcp.Iagent;

        for (let a = 0; a < this.variableObject.agentList.state.length; a++) {
            const agent = this.variableObject.agentList.state[a];

            if (agent.id === id) {
                if (agent.skillName === "") {
                    this.controllerDialog.show(
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

    private onClickMenuUser = (): void => {
        this.variableObject.isMenuItemDocument.state = false;
        this.variableObject.isMenuItemTool.state = false;
        this.variableObject.isMenuItemTask.state = false;
        this.variableObject.isMenuItemAgent.state = false;
        this.variableObject.isMenuItemSkill.state = false;
        this.variableObject.isMenuItemUser.state = !this.variableObject.isMenuItemUser.state;
        this.variableObject.isMenuItemSetting.state = false;

        this.variableObject.agentForm.state = {} as modelMcp.Iagent;
        this.variableObject.isAgentSkillSelect.state = false;
    };

    private onClickUserUpdate = (): void => {
        const errorList = [];

        if (this.hookObject.elementInputUserName.value === "") {
            errorList.push("User name is required.");
        }

        if (this.hookObject.elementInputUserSurname.value === "") {
            errorList.push("User surname is required.");
        }

        if (errorList.length === 0) {
            this.variableObject.userInfo.state.name = this.hookObject.elementInputUserName.value;
            this.variableObject.userInfo.state.surname = this.hookObject.elementInputUserSurname.value;
            this.variableObject.userInfo.state.password = this.hookObject.elementInputUserPassword.value;

            this.controllerMcp.apiUserUpdate(this.variableObject.userInfo.state);
        } else {
            this.controllerToast.show("error", errorList);
        }
    };

    private onClickUserCancel = (): void => {
        this.variableObject.isMenuItemUser.state = false;
    };

    private onClickSettingSave = (): void => {
        const errorList: string[] = [];

        const apiId = parseInt(this.hookObject.elementSelectSettingApiId.value);

        if (isNaN(apiId)) {
            errorList.push("Selected API is invalid.");
        }

        if (errorList.length === 0) {
            this.variableObject.settingInfo.state.apiId = apiId;

            this.controllerMcp.apiSettingUpdate(this.variableObject.settingInfo.state);
        } else {
            this.controllerToast.show("error", errorList);
        }
    };

    private onClickSettingCancel = (): void => {
        this.variableObject.isMenuItemSetting.state = false;
    };

    private onClickMenuSetting = async (): Promise<void> => {
        await this.controllerMcp.apiLlmSelect();

        this.variableObject.isMenuItemDocument.state = false;
        this.variableObject.isMenuItemTool.state = false;
        this.variableObject.isMenuItemTask.state = false;
        this.variableObject.isMenuItemAgent.state = false;
        this.variableObject.isMenuItemSkill.state = false;
        this.variableObject.isMenuItemUser.state = false;
        this.variableObject.isMenuItemSetting.state = !this.variableObject.isMenuItemSetting.state;

        this.variableObject.agentForm.state = {} as modelMcp.Iagent;
        this.variableObject.isAgentSkillSelect.state = false;
    };

    private onClickToggleSelectAll = (mode: string): void => {
        let fileDetailList: modelMcp.IfileDetail[] = [];
        let selectList: string[] = [];

        if (mode === "document") {
            fileDetailList = this.variableObject.documentList.state;
            selectList = this.variableObject.documentSelectList.state;
        } else if (mode === "skill") {
            fileDetailList = this.variableObject.skillList.state;
            selectList = this.variableObject.skillSelectList.state;
        }

        if (this.selectAllCheck(fileDetailList, selectList)) {
            for (const fileDetail of fileDetailList) {
                const index = selectList.indexOf(fileDetail.fileName);

                if (index !== -1) {
                    selectList.splice(index, 1);
                }
            }
        } else {
            for (const fileDetail of fileDetailList) {
                if (!selectList.includes(fileDetail.fileName)) {
                    selectList.push(fileDetail.fileName);
                }
            }
        }

        if (mode === "document") {
            this.variableObject.documentSelectList.state = selectList;
        } else if (mode === "skill") {
            this.variableObject.skillSelectList.state = selectList;
        }
    };

    private windowOpenDocument = (title: string): void => {
        if (!this.variableObject.documentOpenList.state.includes(title)) {
            this.variableObject.documentOpenList.state = [...this.variableObject.documentOpenList.state, title];
        }

        const route = "#/document";

        helperSrc.windowOpen("document", title, route, {
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

    private unselectAgent = (id: number): void => {
        if (this.variableObject.agentSelected.state.id === id) {
            this.variableObject.agentSelected.state = {} as modelMcp.Iagent;

            this.variableObject.systemMode.state = "chat";
        }
    };

    private clearAgentSkill = (list: modelMcp.Iagent[]): void => {
        for (let a = 0; a < list.length; a++) {
            const agent = list[a];

            agent.skillName = "";

            this.controllerMcp.apiAgentUpdate(agent);

            this.unselectAgent(agent.id);
        }
    };

    private dialogMessageDeleteDocument = async (fileName?: string): Promise<void> => {
        let dialogMessage = "";

        if (fileName) {
            dialogMessage = `Are you sure you want to delete: '${fileName}'?`;
        } else {
            dialogMessage = "Are you sure you want to delete the selected items?";
        }

        const isConfirm = await this.controllerDialog.show("warning", dialogMessage, false);

        if (isConfirm) {
            if (fileName) {
                helperSrc.windowClose("document", fileName);

                await this.controllerMcp.apiDocumentDelete(fileName);
            } else {
                for (const fileName of this.variableObject.documentSelectList.state) {
                    helperSrc.windowClose("document", fileName);

                    await this.controllerMcp.apiDocumentDelete(fileName);
                }

                this.variableObject.documentSelectList.state = [];
            }

            this.paginationUpdate("update");
        }
    };

    private dialogMessageDeleteSkill = async (resultList: modelMcp.Iagent[], fileName?: string): Promise<void> => {
        let agentList = [];
        let agentNameList = [];
        let agentObject = {} as modelMenuItem.Iagent;

        let dialogMessage = "";

        if (fileName) {
            for (let a = 0; a < resultList.length; a++) {
                if (resultList[a].skillName === fileName) {
                    agentList.push(resultList[a]);
                    agentNameList.push(resultList[a].name);
                }
            }

            dialogMessage = `Are you sure you want to delete: '${fileName}'?`;
        } else {
            for (const skillSelect of this.variableObject.skillSelectList.state) {
                let agentList = [];

                for (let a = 0; a < resultList.length; a++) {
                    if (resultList[a].skillName === skillSelect) {
                        agentList.push(resultList[a]);
                    }
                }

                if (agentList.length > 0) {
                    agentObject[skillSelect] = agentList;
                }
            }

            dialogMessage = "Are you sure you want to delete the selected items?";
        }

        if (fileName && agentList.length > 0) {
            dialogMessage = `Skill is being used by the agent: ${agentNameList.join(", ")}.\nIf you delete the skill, it will be removed in the agent.\n\n${dialogMessage}`;
        } else if (!fileName && Object.keys(agentObject).length > 0) {
            dialogMessage = `One of the selected skills is being used by an agent.\nIf you delete the skill, it will be removed in the agent.\n\n${dialogMessage}`;
        }

        const isConfirm = await this.controllerDialog.show("warning", dialogMessage, false);

        if (isConfirm) {
            if (fileName) {
                await this.controllerMcp.apiSkillDelete(fileName);

                this.clearAgentSkill(agentList);
            } else {
                for (const skillSelect of this.variableObject.skillSelectList.state) {
                    await this.controllerMcp.apiSkillDelete(skillSelect);

                    if (skillSelect in agentObject) {
                        this.clearAgentSkill(agentObject[skillSelect]);
                    }
                }

                this.variableObject.skillSelectList.state = [];
            }

            this.paginationUpdate("update");
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
        this.controllerPagination = new ControllerPagination();
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
                isMenuItemUser: false,
                isMenuItemSetting: false,
                documentList: variableLink<modelMcp.IfileDetail[]>("Mcp"),
                documentOpenList: [],
                documentSelectList: [],
                isDocumentUpload: false,
                isRagEmbeddingStart: false,
                isRagGraphOpen: false,
                isRagGraphHtmlLoading: false,
                ragGraphHtml: "",
                skillList: variableLink<modelMcp.IfileDetail[]>("Mcp"),
                skillSelectList: [],
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
                userInfo: variableLink<modelMcp.Iuser>("Mcp"),
                isUserUpdate: false,
                llmList: variableLink<modelMcp.Illm[]>("Mcp"),
                settingInfo: variableLink<modelMcp.Isetting>("Mcp"),
                isSettingSave: false,
                systemMode: variableLink<string>("Chat"),
                pageNumber: variableLink<number>("Pagination")
            },
            this.constructor.name
        );

        this.methodObject = {
            selectAllCheck: this.selectAllCheck,
            onClickMenuDocument: this.onClickMenuDocument,
            onClickDocumentUpload: this.onClickDocumentUpload,
            onClickDocumentCheckbox: this.onClickDocumentCheckbox,
            onClickDocumentDelete: this.onClickDocumentDelete,
            onClickDocumentDeleteSelected: this.onClickDocumentDeleteSelected,
            onClickRagStart: this.onClickRagStart,
            onClickRagGraph: this.onClickRagGraph,
            onClickRagGraphBack: this.onClickRagGraphBack,
            onClickMenuSkill: this.onClickMenuSkill,
            onClickSkillUpload: this.onClickSkillUpload,
            onClickSkillCheckbox: this.onClickSkillCheckbox,
            onClickSkillDelete: this.onClickSkillDelete,
            onClickSkillDeleteSelected: this.onClickSkillDeleteSelected,
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
            onClickMenuUser: this.onClickMenuUser,
            onClickUserUpdate: this.onClickUserUpdate,
            onClickUserCancel: this.onClickUserCancel,
            onClickMenuSetting: this.onClickMenuSetting,
            onClickSettingSave: this.onClickSettingSave,
            onClickSettingCancel: this.onClickSettingCancel,
            onClickToggleSelectAll: this.onClickToggleSelectAll,
            windowOpenDocument: this.windowOpenDocument
        };
    }

    variableEffect(watch: IvariableEffect): void {
        watch([
            {
                variableList: ["pageNumber"],
                action: () => {
                    this.paginationUpdate("update");
                }
            }
        ]);
    }

    view(name?: string): IvirtualNode {
        if (name === "left") {
            return viewMenuItem.left(this.variableObject, this.methodObject);
        } else if (name === "right") {
            return viewMenuItem.right(this.variableObject, this.methodObject);
        }

        throw new Error(`Unsupported view: ${String(name)}`);
    }

    event(): void {
        listen<modelDocument.Idata>("document-data", (eventData) => {
            const fileName = eventData.payload.fileName;

            if (fileName && !this.variableObject.documentOpenList.state.includes(fileName)) {
                this.variableObject.documentOpenList.state = [...this.variableObject.documentOpenList.state, fileName];
            }
        }).then((unlistenFn) => {
            this.unlistenWindowDocumentData = unlistenFn;
        });

        listen<modelDocument.Idata>("document-close", (eventData) => {
            const fileName = eventData.payload.fileName;

            const filteredList = [];

            for (let a = 0; a < this.variableObject.documentOpenList.state.length; a++) {
                if (this.variableObject.documentOpenList.state[a] !== fileName) {
                    filteredList.push(this.variableObject.documentOpenList.state[a]);
                }
            }

            this.variableObject.documentOpenList.state = filteredList;
        }).then((unlistenFn) => {
            this.unlistenWindowDocumentClose = unlistenFn;
        });
    }

    subControllerList(): Icontroller[] {
        const resultList: Icontroller[] = [];

        resultList.push(this.controllerPagination);

        return resultList;
    }

    rendered(): void {}

    destroy(): void {
        if (this.unlistenWindowDocumentData !== undefined) {
            this.unlistenWindowDocumentData();

            this.unlistenWindowDocumentData = undefined;
        }

        if (this.unlistenWindowDocumentClose !== undefined) {
            this.unlistenWindowDocumentClose();

            this.unlistenWindowDocumentClose = undefined;
        }
    }
}
