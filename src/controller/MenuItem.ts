import { Icontroller, IvariableEffect, IvirtualNode, variableBind, variableLink } from "@cimo/jsmvcfw/dist/src/Main.js";
import { listen, UnlistenFn } from "@tauri-apps/api/event";

// Source
import * as helperSrc from "../HelperSrc";
import * as modelMenuItem from "../model/MenuItem";
import * as modelMcp from "../model/Mcp";
import * as modelDocument from "../model/Document";
import * as viewMenuItem from "../view/MenuItem";
import type Mcp from "./Mcp";
import ControllerDialog from "./Dialog";
import ControllerPagination from "./Pagination";

export default class MenuItem implements Icontroller {
    // Variable
    private variableObject: modelMenuItem.Ivariable;
    private methodObject: modelMenuItem.Imethod;
    private controllerMcp: Mcp;
    private controllerDialog: ControllerDialog;
    private controllerPagination: ControllerPagination;

    private unlistenWindowDocumentData: UnlistenFn | undefined = undefined;
    private unlistenWindowDocumentClose: UnlistenFn | undefined = undefined;

    // Method
    private itemId = (key: string): number => {
        return this.controllerPagination.itemId(parseInt(key));
    };

    private selectAllCheck = (mode: string): boolean => {
        let isResult = true;

        let fileDetailList: modelMcp.IfileDetail[] = [];
        let selectList: string[] = [];

        if (mode === "document") {
            fileDetailList = this.variableObject.documentList.state;
            selectList = this.variableObject.documentSelectList.state;
        } else if (mode === "skill") {
            fileDetailList = this.variableObject.skillList.state;
            selectList = this.variableObject.skillSelectList.state;
        }

        for (const fileDetail of fileDetailList) {
            const path = this.itemPathCurrent(mode, fileDetail.fileName);

            if (!selectList.includes(path)) {
                isResult = false;

                break;
            }
        }

        return isResult;
    };

    private itemPathCurrent = (mode: string, value: string): string => {
        let result = "";

        if (mode === "document") {
            const fileDetail = helperSrc.fileDetail(value);

            const pathCurrent = fileDetail.baseName ? `${fileDetail.baseName}/${fileDetail.fileName}` : `${value}/`;

            if (this.variableObject.isMenuItemDocument.state && this.variableObject.documentCurrentFolderList.state.length > 0) {
                result = `${this.variableObject.documentCurrentFolderList.state.join("/")}/${pathCurrent}`;
            } else {
                result = pathCurrent;
            }
        } else if (mode === "skill") {
            result = value;
        }

        return result;
    };

    private checkProcessOngoing = (mode: string): boolean => {
        let isResult = false;

        if (mode === "document") {
            isResult =
                this.variableObject.isUploadRunning.state ||
                this.variableObject.isDeleteRunning.state ||
                this.variableObject.isRagRunning.state ||
                this.variableObject.isDocumentFolderMoveRunning.state ||
                this.variableObject.isDocumentFolderCreateRunning.state;
        } else if (mode === "skill") {
            isResult = this.variableObject.isUploadRunning.state || this.variableObject.isDeleteRunning.state;
        }

        return isResult;
    };

    private paginationState = async (mode: string, itemList?: modelMcp.IfileDetail[]): Promise<void> => {
        if (mode === "initialize" && itemList) {
            this.variableObject.pageNumber.state = 1;
        }

        if (this.variableObject.isMenuItemDocument.state) {
            if (mode === "update") {
                itemList = await this.controllerMcp.apiDocumentSelect(this.variableObject.documentCurrentFolderList.state);
            }

            if (itemList) {
                itemList.sort((firstObject, secondObject) => {
                    const isFolderFirst = firstObject.category === "folder";
                    const isFolderSecond = secondObject.category === "folder";

                    if (isFolderFirst !== isFolderSecond) {
                        return isFolderFirst ? -1 : 1;
                    }

                    return firstObject.fileName.localeCompare(secondObject.fileName, undefined, { numeric: true, sensitivity: "variant" });
                });

                this.variableObject.documentList.state = this.controllerPagination.updateList<modelMcp.IfileDetail>(itemList);
            }
        } else if (this.variableObject.isMenuItemSkill.state || this.variableObject.isAgentSkillSelect.state) {
            if (mode === "update") {
                itemList = await this.controllerMcp.apiSkillSelect();
            }

            if (itemList) {
                itemList.sort((firstObject, secondObject) =>
                    firstObject.fileName.localeCompare(secondObject.fileName, undefined, { numeric: true, sensitivity: "variant" })
                );

                this.variableObject.skillList.state = this.controllerPagination.updateList<modelMcp.IfileDetail>(itemList);
            }
        }
    };

    private documentCreateFolder = async (): Promise<void> => {
        if (this.variableObject.isDocumentFolderStillCreate.state) {
            this.variableObject.isDocumentFolderStillCreate.state = false;

            const elementInputValue = this.hookObject.elementInputDocumentFolderName.value;

            const isFolderCreate = await this.controllerMcp.apiDocumentFolderCreate(
                elementInputValue,
                this.variableObject.documentCurrentFolderList.state
            );

            if (!isFolderCreate) {
                this.variableObject.documentList.state.shift();
            } else {
                await this.paginationState("update");
            }
        }
    };

    private documentWindowOpen = async (title: string): Promise<void> => {
        if (!this.variableObject.documentOpenList.state.includes(title)) {
            this.variableObject.documentOpenList.state = [...this.variableObject.documentOpenList.state, title];
        }

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

    private agentUnselect = (id: number): void => {
        if (this.variableObject.agentSelected.state.id === id) {
            this.variableObject.agentSelected.state = {} as modelMcp.Iagent;

            this.variableObject.systemMode.state = "chat";
        }
    };

    private agentSkillClear = async (list: modelMcp.Iagent[]): Promise<void> => {
        for (let a = 0; a < list.length; a++) {
            const agent = list[a];

            agent.skillName = "";

            await this.controllerMcp.apiAgentUpdate(agent);

            this.agentUnselect(agent.id);
        }
    };

    private itemDelete = async (mode: string, path: string): Promise<boolean> => {
        let isResult = false;
        let selectList: string[] = [];

        if (mode === "document") {
            selectList = this.variableObject.documentSelectList.state;

            isResult = await this.controllerMcp.apiDocumentDelete(path);
        } else if (mode === "skill") {
            selectList = this.variableObject.skillSelectList.state;

            isResult = await this.controllerMcp.apiSkillDelete(path);
        }

        if (isResult) {
            const index = selectList.indexOf(path);

            if (index !== -1) {
                selectList.splice(index, 1);
            }

            this.updateSelectList(mode, selectList);
        }

        return isResult;
    };

    private dialogMessageDeleteDocument = async (fileName?: string): Promise<void> => {
        let dialogMessage = "";

        if (!fileName) {
            dialogMessage = "Are you sure you want to delete the selected items?";
        } else {
            dialogMessage = `Are you sure you want to delete: '${fileName}'?`;
        }

        const isConfirm = await this.controllerDialog.show("warning", dialogMessage, false);

        if (isConfirm) {
            this.variableObject.isDeleteRunning.state = true;

            if (!fileName) {
                for (const documentSelect of this.variableObject.documentSelectList.state.slice()) {
                    const fileDetail = await helperSrc.fileDetail(documentSelect);

                    if (fileDetail.fileName) {
                        await helperSrc.windowClose("document", fileDetail.fileName);
                    }

                    await this.itemDelete("document", documentSelect);
                }
            } else {
                await helperSrc.windowClose("document", fileName);

                const path = this.itemPathCurrent("document", fileName);

                await this.itemDelete("document", path);
            }

            await this.paginationState("update");

            this.variableObject.isDeleteRunning.state = false;
        }
    };

    private dialogMessageDeleteSkill = async (resultList: modelMcp.Iagent[], fileName?: string): Promise<void> => {
        let agentList: modelMcp.Iagent[] = [];
        let agentNameList: string[] = [];
        let agentObject = {} as modelMenuItem.Iagent;

        let dialogMessage = "";

        if (!fileName) {
            for (const skillSelect of this.variableObject.skillSelectList.state) {
                let agentList: modelMcp.Iagent[] = [];

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
        } else {
            for (let a = 0; a < resultList.length; a++) {
                if (resultList[a].skillName === fileName) {
                    agentList.push(resultList[a]);
                    agentNameList.push(resultList[a].name);
                }
            }

            dialogMessage = `Are you sure you want to delete: '${fileName}'?`;
        }

        if (fileName && agentList.length > 0) {
            dialogMessage = `Skill is being used by the agent: ${agentNameList.join(", ")}.\nIf you delete the skill, it will be removed in the agent.\n\n${dialogMessage}`;
        } else if (!fileName && Object.keys(agentObject).length > 0) {
            dialogMessage = `One of the selected skills is being used by an agent.\nIf you delete the skill, it will be removed in the agent.\n\n${dialogMessage}`;
        }

        const isConfirm = await this.controllerDialog.show("warning", dialogMessage, false);

        if (isConfirm) {
            this.variableObject.isDeleteRunning.state = true;

            if (!fileName) {
                for (const skillSelect of this.variableObject.skillSelectList.state.slice()) {
                    const isDelete = await this.itemDelete("skill", skillSelect);

                    if (isDelete && skillSelect in agentObject) {
                        await this.agentSkillClear(agentObject[skillSelect]);
                    }
                }

                this.variableObject.skillSelectList.state = [];
            } else {
                const isDelete = await this.itemDelete("skill", fileName);

                if (isDelete) {
                    await this.agentSkillClear(agentList);
                }
            }

            await this.paginationState("update");

            this.variableObject.isDeleteRunning.state = false;
        }
    };

    private updateSelectList = (mode: string, selectList: string[]): void => {
        if (mode === "document") {
            this.variableObject.documentSelectList.state = selectList;

            if (this.variableObject.documentSelectList.state.length === 0) {
                this.variableObject.isDocumentFolderMoveSelecting.state = false;
            }
        } else if (mode === "skill") {
            this.variableObject.skillSelectList.state = selectList;
        }
    };

    private onClickCheckbox = (mode: string, fileName: string): void => {
        let selectList: string[] = [];

        if (mode === "document") {
            selectList = this.variableObject.documentSelectList.state;
        } else if (mode === "skill") {
            selectList = this.variableObject.skillSelectList.state;
        }

        const path = this.itemPathCurrent(mode, fileName);

        if (!selectList.includes(path)) {
            selectList.push(path);
        } else {
            const index = selectList.indexOf(path);

            if (index !== -1) {
                selectList.splice(index, 1);
            }
        }

        this.updateSelectList(mode, selectList);
    };

    private onClickMenuDocument = (): void => {
        this.variableObject.documentCurrentFolderList.state = [];

        this.controllerMcp.apiDocumentSelect(this.variableObject.documentCurrentFolderList.state).then(async () => {
            this.variableObject.isMenuItemDocument.state = !this.variableObject.isMenuItemDocument.state;
            this.variableObject.isMenuItemTool.state = false;
            this.variableObject.isMenuItemTask.state = false;
            this.variableObject.isMenuItemAgent.state = false;
            this.variableObject.isMenuItemSkill.state = false;
            this.variableObject.isMenuItemUser.state = false;
            this.variableObject.isMenuItemSetting.state = false;

            this.variableObject.agentData.state = {} as modelMcp.Iagent;
            this.variableObject.isAgentSkillSelect.state = false;

            await this.paginationState("initialize", this.variableObject.documentList.state);
        });
    };

    private onClickDocumentUpload = async (): Promise<void> => {
        await this.controllerMcp.apiDocumentUpload(this.variableObject.documentCurrentFolderList.state);

        await this.paginationState("update");
    };

    private onClickDocumentDelete = async (fileName: string): Promise<void> => {
        await this.dialogMessageDeleteDocument(fileName);
    };

    private onClickDocumentDeleteSelected = async (): Promise<void> => {
        await this.dialogMessageDeleteDocument();
    };

    private onClickDocumentFolderCreate = (): void => {
        if (!this.variableObject.isDocumentFolderStillCreate.state) {
            this.variableObject.isDocumentFolderStillCreate.state = true;

            this.variableObject.documentList.state.unshift({
                fileName: "",
                extension: "",
                category: "folder"
            } as modelMcp.IfileDetail);
        }
    };

    private onClickDocumentFolderBack = (): void => {
        this.variableObject.documentCurrentFolderList.state.pop();

        this.controllerMcp.apiDocumentSelect(this.variableObject.documentCurrentFolderList.state).then(async () => {
            await this.paginationState("initialize", this.variableObject.documentList.state);
        });
    };

    private onClickDocumentFolderMoveTo = async (): Promise<void> => {
        this.variableObject.isDocumentFolderMoveSelecting.state = !this.variableObject.isDocumentFolderMoveSelecting.state;
    };

    private onClickDocumentFolderHere = async (): Promise<void> => {
        const isFolderMove = await this.controllerMcp.apiDocumentFolderMove(
            this.variableObject.documentSelectList.state,
            this.variableObject.documentCurrentFolderList.state
        );

        if (isFolderMove) {
            await this.paginationState("update");

            this.updateSelectList("document", []);
        }
    };

    private onClickDocumentOpen = async (fileName: string, category: string): Promise<void> => {
        if (category === "folder") {
            this.variableObject.documentCurrentFolderList.state.push(fileName);

            this.controllerMcp.apiDocumentSelect(this.variableObject.documentCurrentFolderList.state).then(async () => {
                await this.paginationState("initialize", this.variableObject.documentList.state);
            });
        } else {
            await this.documentWindowOpen(fileName);
        }
    };

    private onClickRagStart = (): void => {
        this.controllerMcp.apiRagStart();
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
        this.controllerMcp.apiSkillSelect().then(async () => {
            this.variableObject.isMenuItemDocument.state = false;
            this.variableObject.isMenuItemTool.state = false;
            this.variableObject.isMenuItemTask.state = false;
            this.variableObject.isMenuItemAgent.state = false;
            this.variableObject.isMenuItemSkill.state = !this.variableObject.isMenuItemSkill.state;
            this.variableObject.isMenuItemUser.state = false;
            this.variableObject.isMenuItemSetting.state = false;

            this.variableObject.agentData.state = {} as modelMcp.Iagent;
            this.variableObject.isAgentSkillSelect.state = false;

            await this.paginationState("initialize", this.variableObject.skillList.state);
        });
    };

    private onClickSkillUpload = async (): Promise<void> => {
        await this.controllerMcp.apiSkillUpload();

        await this.paginationState("update");
    };

    private onClickSkillDelete = (fileName: string): void => {
        this.controllerMcp.apiAgentSelect().then(async (resultApiList) => {
            await this.dialogMessageDeleteSkill(resultApiList, fileName);
        });
    };

    private onClickSkillDeleteSelected = (): void => {
        this.controllerMcp.apiAgentSelect().then(async (resultApiList) => {
            await this.dialogMessageDeleteSkill(resultApiList);
        });
    };

    private onClickSelectSkill = (): void => {
        this.controllerMcp.apiSkillSelect().then(async () => {
            this.variableObject.agentData.state.name = this.hookObject.elementInputAgentName.value;
            this.variableObject.agentData.state.description = this.hookObject.elementInputAgentDescription.value;

            this.variableObject.isAgentSkillSelect.state = true;

            await this.paginationState("initialize", this.variableObject.skillList.state);
        });
    };

    private onClickSkillSelect = (fileName: string): void => {
        this.variableObject.agentData.state.skillName = fileName;

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

        this.variableObject.agentData.state = {} as modelMcp.Iagent;
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

        this.variableObject.agentData.state = {} as modelMcp.Iagent;
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

            this.variableObject.agentData.state = {} as modelMcp.Iagent;
            this.variableObject.isAgentSkillSelect.state = false;
        });
    };

    private onClickAgentCreate = (): void => {
        this.variableObject.agentData.state = {
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
                this.variableObject.agentData.state = agent;

                break;
            }
        }
    };

    private onClickAgentDelete = async (index: number, id: number, name: string): Promise<void> => {
        const isConfirm = await this.controllerDialog.show("warning", `Are you sure you want to delete: '${name}'?`, false);

        if (isConfirm) {
            const isDelete = await this.controllerMcp.apiAgentDelete(index, id);

            if (isDelete) {
                this.agentUnselect(id);
            }
        }
    };

    private onClickAgentSave = (): void => {
        this.variableObject.agentData.state.name = this.hookObject.elementInputAgentName.value;
        this.variableObject.agentData.state.description = this.hookObject.elementInputAgentDescription.value;

        if (this.variableObject.agentData.state.id === -1) {
            this.controllerMcp.apiAgentCreate(this.variableObject.agentData.state);
        } else {
            this.controllerMcp.apiAgentUpdate(this.variableObject.agentData.state);
        }
    };

    private onClickAgentCancel = (): void => {
        this.controllerMcp.apiAgentSelect().then(() => {
            this.variableObject.agentData.state = {} as modelMcp.Iagent;
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
        this.controllerMcp.apiUserSelect().then(() => {
            this.variableObject.isMenuItemDocument.state = false;
            this.variableObject.isMenuItemTool.state = false;
            this.variableObject.isMenuItemTask.state = false;
            this.variableObject.isMenuItemAgent.state = false;
            this.variableObject.isMenuItemSkill.state = false;
            this.variableObject.isMenuItemUser.state = !this.variableObject.isMenuItemUser.state;
            this.variableObject.isMenuItemSetting.state = false;

            this.variableObject.agentData.state = {} as modelMcp.Iagent;
            this.variableObject.isAgentSkillSelect.state = false;
        });
    };

    private onClickUserUpdate = (): void => {
        const userCopy = { ...this.variableObject.user.state };

        userCopy.name = this.hookObject.elementInputUserName.value;
        userCopy.surname = this.hookObject.elementInputUserSurname.value;
        userCopy.password = this.hookObject.elementInputUserPassword.value;

        this.controllerMcp.apiUserUpdate(userCopy);
    };

    private onClickUserCancel = (): void => {
        this.variableObject.isMenuItemUser.state = false;
    };

    private onChangeSettingLlmServiceId = (): void => {
        this.variableObject.settingLlmServiceId.state = parseInt(this.hookObject.elementSelectSettingLlmServiceId.value);
    };

    private onClickSettingSave = (): void => {
        const llmServiceId = parseInt(this.hookObject.elementSelectSettingLlmServiceId.value);

        const settingCopy: modelMcp.Isetting = {
            id: this.variableObject.setting.state.id,
            llm: []
        };

        for (const llm of this.variableObject.setting.state.llm) {
            settingCopy.llm.push({
                ...llm,
                url: llm.id === llmServiceId ? this.hookObject.elementInputSettingLlmUrl.value : llm.url,
                apiKey: llm.id === llmServiceId ? this.hookObject.elementInputSettingLlmApiKey.value : llm.apiKey,
                selected: llm.id === llmServiceId ? true : false
            });
        }

        this.controllerMcp.apiSettingUpdate(settingCopy);
    };

    private onClickSettingCancel = (): void => {
        this.variableObject.isMenuItemSetting.state = false;
    };

    private onClickMenuSetting = async (): Promise<void> => {
        this.controllerMcp.apiSettingSelect().then(() => {
            this.variableObject.isMenuItemDocument.state = false;
            this.variableObject.isMenuItemTool.state = false;
            this.variableObject.isMenuItemTask.state = false;
            this.variableObject.isMenuItemAgent.state = false;
            this.variableObject.isMenuItemSkill.state = false;
            this.variableObject.isMenuItemUser.state = false;
            this.variableObject.isMenuItemSetting.state = !this.variableObject.isMenuItemSetting.state;

            this.variableObject.agentData.state = {} as modelMcp.Iagent;
            this.variableObject.isAgentSkillSelect.state = false;
        });
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

        if (!this.selectAllCheck(mode)) {
            for (const fileDetail of fileDetailList) {
                const path = this.itemPathCurrent(mode, fileDetail.fileName);

                if (!selectList.includes(path)) {
                    selectList.push(path);
                }
            }
        } else {
            for (const fileDetail of fileDetailList) {
                const path = this.itemPathCurrent(mode, fileDetail.fileName);

                const index = selectList.indexOf(path);

                if (index !== -1) {
                    selectList.splice(index, 1);
                }
            }
        }

        this.updateSelectList(mode, selectList);
    };

    private onInputDocumentFolderName = async (event: KeyboardEvent): Promise<void> => {
        if (event.key === "Enter") {
            await this.documentCreateFolder();
        }
    };

    setControllerMcp(value: Mcp): void {
        this.controllerMcp = value;
    }

    constructor() {
        this.variableObject = {} as modelMenuItem.Ivariable;
        this.methodObject = {} as modelMenuItem.Imethod;

        this.controllerMcp = {} as Mcp;

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
                documentCurrentFolderList: [],
                isUploadRunning: false,
                isDeleteRunning: false,
                isDocumentFolderStillCreate: false,
                isDocumentFolderCreateRunning: false,
                isDocumentFolderMoveSelecting: false,
                isDocumentFolderMoveRunning: false,
                isRagRunning: false,
                isRagGraphOpen: false,
                isRagGraphHtmlLoading: false,
                ragGraphHtml: "",
                skillList: variableLink<modelMcp.IfileDetail[]>("Mcp"),
                skillSelectList: [],
                toolList: variableLink<modelMcp.Itool[]>("Mcp"),
                toolSelected: variableLink<modelMcp.Itool>("Mcp"),
                taskList: variableLink<modelMcp.Itask[]>("Mcp"),
                taskSelected: variableLink<modelMcp.Itask>("Mcp"),
                agentList: variableLink<modelMcp.Iagent[]>("Mcp"),
                agentSelected: variableLink<modelMcp.Iagent>("Mcp"),
                agentData: {} as modelMcp.Iagent,
                isAgentSkillSelect: false,
                isAgentSave: false,
                user: variableLink<modelMcp.Iuser>("Mcp"),
                isUserUpdate: false,
                setting: variableLink<modelMcp.Isetting>("Mcp"),
                settingLlmServiceId: 1,
                isSettingSave: false,
                systemMode: variableLink<string>("Chat"),
                pageNumber: variableLink<number>("Pagination")
            },
            this.constructor.name
        );

        this.methodObject = {
            itemId: this.itemId,
            selectAllCheck: this.selectAllCheck,
            itemPathCurrent: this.itemPathCurrent,
            checkProcessOngoing: this.checkProcessOngoing,
            onClickCheckbox: this.onClickCheckbox,
            onClickMenuDocument: this.onClickMenuDocument,
            onClickDocumentUpload: this.onClickDocumentUpload,
            onClickDocumentDelete: this.onClickDocumentDelete,
            onClickDocumentDeleteSelected: this.onClickDocumentDeleteSelected,
            onClickDocumentFolderCreate: this.onClickDocumentFolderCreate,
            onClickDocumentFolderBack: this.onClickDocumentFolderBack,
            onClickDocumentFolderMoveTo: this.onClickDocumentFolderMoveTo,
            onClickDocumentFolderHere: this.onClickDocumentFolderHere,
            onClickDocumentOpen: this.onClickDocumentOpen,
            onClickRagStart: this.onClickRagStart,
            onClickRagGraph: this.onClickRagGraph,
            onClickRagGraphBack: this.onClickRagGraphBack,
            onClickMenuSkill: this.onClickMenuSkill,
            onClickSkillUpload: this.onClickSkillUpload,
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
            onChangeSettingLlmServiceId: this.onChangeSettingLlmServiceId,
            onClickSettingSave: this.onClickSettingSave,
            onClickSettingCancel: this.onClickSettingCancel,
            onClickToggleSelectAll: this.onClickToggleSelectAll,
            onInputDocumentFolderName: this.onInputDocumentFolderName
        };
    }

    variableEffect(watch: IvariableEffect): void {
        watch([
            {
                variableList: ["pageNumber"],
                action: async () => {
                    await this.paginationState("update");
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

            const filteredList: string[] = [];

            for (let a = 0; a < this.variableObject.documentOpenList.state.length; a++) {
                if (this.variableObject.documentOpenList.state[a] !== fileName) {
                    filteredList.push(this.variableObject.documentOpenList.state[a]);
                }
            }

            this.variableObject.documentOpenList.state = filteredList;
        }).then((unlistenFn) => {
            this.unlistenWindowDocumentClose = unlistenFn;
        });

        document.addEventListener("click", async (event) => {
            const target = event.target as HTMLElement;

            if (!helperSrc.findElementParent(target, "input_folder_name") && !helperSrc.findElementParent(target, "button_create_folder")) {
                await this.documentCreateFolder();
            }
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
