import { Icontroller, IvariableEffect, IvirtualNode, variableBind, variableLink } from "@cimo/jsmvcfw/dist/src/Main.js";
import { listen, UnlistenFn } from "@tauri-apps/api/event";

// Source
import * as session from "../Session";
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

    private workspaceFullList: modelMcp.IitemDetail[] = [];
    private skillFullList: modelMcp.IitemDetail[] = [];
    private isMenuItemLoading = false;

    // Method
    private selectAllCheck = (mode: string): boolean => {
        let isResult = false;

        let itemDetailList: modelMcp.IitemDetail[] = [];
        let selectList: string[] = [];

        if (mode === "workspace") {
            itemDetailList = this.variableObject.workspaceItemList.state;
            selectList = this.variableObject.workspaceSelectList.state;
        } else if (mode === "skill") {
            itemDetailList = this.variableObject.skillList.state;
            selectList = this.variableObject.skillSelectList.state;
        }

        let includeCount = 0;

        for (const itemDetail of itemDetailList) {
            const pathItemSelected = this.itemSelectedPath(mode, itemDetail);

            if (selectList.includes(pathItemSelected)) {
                includeCount++;
            }
        }

        if (includeCount === itemDetailList.length) {
            isResult = true;
        }

        return isResult;
    };

    private updateSelectList = (mode: string, selectList: string[]): void => {
        if (mode === "workspace") {
            this.variableObject.workspaceSelectList.state = selectList;

            if (this.variableObject.workspaceSelectList.state.length === 0) {
                this.variableObject.isWorkspaceFolderMoveSelecting.state = false;
            }
        } else if (mode === "skill") {
            this.variableObject.skillSelectList.state = selectList;
        }
    };

    private checkProcessOngoing = (mode: string): boolean => {
        let isResult = false;

        if (mode === "workspace") {
            isResult =
                this.variableObject.isUploadRunning.state ||
                this.variableObject.isDeleteRunning.state ||
                this.variableObject.isRagRunning.state ||
                this.variableObject.isWorkspaceFolderMoveRunning.state ||
                this.variableObject.isWorkspaceFolderCreateRunning.state;
        } else if (mode === "skill") {
            isResult = this.variableObject.isUploadRunning.state || this.variableObject.isDeleteRunning.state;
        }

        return isResult;
    };

    private checkRenameSelected = (itemDetail: modelMcp.IitemDetail): boolean => {
        return this.variableObject.workspaceRenameSelected.state === this.itemSelectedPath("workspace", itemDetail);
    };

    private checkItemSelected = (itemDetail: modelMcp.IitemDetail): boolean => {
        return this.variableObject.workspaceSelectList.state.includes(this.itemSelectedPath("workspace", itemDetail));
    };

    private itemId = (key: string): number => {
        return this.controllerPagination.itemId(parseInt(key));
    };

    private itemSelectedPath = (mode: string, itemDetail: modelMcp.IitemDetail): string => {
        let result = "";

        if (mode === "workspace") {
            const pathCurrent = itemDetail.baseName ? `${itemDetail.baseName}/${itemDetail.name}` : `${itemDetail.name}/`;

            if (this.variableObject.isMenuItemWorkspace.state && this.variableObject.workspaceCurrentFolderList.state.length > 0) {
                result = `${this.variableObject.workspaceCurrentFolderList.state.join("/")}/${pathCurrent}`;
            } else {
                result = pathCurrent;
            }
        } else if (mode === "skill") {
            result = itemDetail.name;
        }

        return result;
    };

    private itemDelete = async (mode: string, selectList: string[]): Promise<boolean> => {
        let isResult = false;

        this.variableObject.isDeleteRunning.state = true;

        if (mode === "workspace") {
            isResult = await this.controllerMcp.apiWorkspaceDelete(selectList);
        } else if (mode === "skill") {
            isResult = await this.controllerMcp.apiSkillDelete(selectList);
        }

        if (isResult) {
            for (const item of selectList) {
                const itemDetail = await helperSrc.fileDetail(item);

                if (!itemDetail.baseName) {
                    const folderName = item.replace(/\/+$/, "").split("/").pop() ?? "";

                    const indexFolder = this.variableObject.workspaceCurrentFolderList.state.indexOf(folderName);

                    if (indexFolder !== -1) {
                        this.variableObject.workspaceCurrentFolderList.state.splice(indexFolder);
                    }
                }
            }

            await this.paginationLoad(mode, false);

            this.updateSelectList(mode, []);
        }

        this.variableObject.isDeleteRunning.state = false;

        return isResult;
    };

    private paginationMode = (): string => {
        let result = "";

        if (this.variableObject.isMenuItemWorkspace.state) {
            result = "workspace";
        } else if (this.variableObject.isMenuItemSkill.state || this.variableObject.isAgentSkillSelect.state) {
            result = "skill";
        }

        return result;
    };

    private paginationSlice = (mode: string): void => {
        if (mode === "workspace") {
            this.variableObject.workspaceItemList.state = this.controllerPagination.updateList<modelMcp.IitemDetail>(this.workspaceFullList);
        } else if (mode === "skill") {
            this.variableObject.skillList.state = this.controllerPagination.updateList<modelMcp.IitemDetail>(this.skillFullList);
        }
    };

    private paginationLoad = async (mode: string, isInitialize: boolean): Promise<void> => {
        if (mode === "workspace") {
            const itemList = await this.controllerMcp.apiWorkspace(this.variableObject.workspaceCurrentFolderList.state);

            itemList.sort((firstObject, secondObject) => {
                const isFolderFirst = firstObject.category === "folder";
                const isFolderSecond = secondObject.category === "folder";

                if (isFolderFirst !== isFolderSecond) {
                    return isFolderFirst ? -1 : 1;
                }

                return firstObject.name.localeCompare(secondObject.name, undefined, { numeric: true, sensitivity: "variant" });
            });

            this.workspaceFullList = itemList;
        } else if (mode === "skill") {
            const itemList = await this.controllerMcp.apiSkill();

            itemList.sort((firstObject, secondObject) =>
                firstObject.name.localeCompare(secondObject.name, undefined, { numeric: true, sensitivity: "variant" })
            );

            this.skillFullList = itemList;
        }

        if (isInitialize) {
            this.variableObject.pageNumber.state = 1;
        }

        this.paginationSlice(mode);
    };

    private workspaceCreateFolder = async (): Promise<void> => {
        if (this.variableObject.isWorkspaceFolderStillCreate.state) {
            this.variableObject.isWorkspaceFolderStillCreate.state = false;
            this.variableObject.isWorkspaceFolderCreateRunning.state = true;

            const elementInputValue = this.hookObject.elementInputWorkspaceFolderName.value;

            const isFolderCreate = await this.controllerMcp.apiWorkspaceFolderCreate(
                elementInputValue,
                this.variableObject.workspaceCurrentFolderList.state
            );

            if (!isFolderCreate) {
                this.variableObject.workspaceItemList.state.shift();
            } else {
                await this.paginationLoad("workspace", false);
            }

            this.variableObject.isWorkspaceFolderCreateRunning.state = false;
        }
    };

    private workspaceRename = async (): Promise<void> => {
        if (this.variableObject.workspaceRenameSelected.state !== "") {
            const elementInputValue = this.hookObject.elementInputWorkspaceRename.value;

            const isRename = await this.controllerMcp.apiWorkspaceRename(this.variableObject.workspaceRenameSelected.state, elementInputValue);

            if (isRename) {
                await this.paginationLoad("workspace", false);
            }

            this.variableObject.workspaceRenameSelected.state = "";
        }
    };

    private windowOpenDocument = async (title: string): Promise<void> => {
        await this.controllerMcp.apiUserQuery();

        if (!session.data.mcpCookie || this.variableObject.isOfflineMcp.state) {
            return;
        }

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

            const isUpdate = await this.controllerMcp.apiAgentUpdate(agent);

            if (isUpdate) {
                await this.controllerMcp.apiAgent();

                this.agentUnselect(agent.id);
            }
        }
    };

    private dialogMessageDeleteWorkspaceItem = async (itemDetail?: modelMcp.IitemDetail): Promise<void> => {
        let dialogMessage = "";

        if (!itemDetail) {
            dialogMessage = "Are you sure you want to delete the selected items?";
        } else {
            dialogMessage = `Are you sure you want to delete: '${itemDetail.name}'?`;
        }

        const isConfirm = await this.controllerDialog.show("warning", dialogMessage, false);

        if (isConfirm) {
            if (!itemDetail) {
                for (const workspaceSelect of this.variableObject.workspaceSelectList.state) {
                    const fileDetail = await helperSrc.fileDetail(workspaceSelect);

                    if (fileDetail.name) {
                        await helperSrc.windowClose("document", fileDetail.name);
                    }
                }

                await this.itemDelete("workspace", this.variableObject.workspaceSelectList.state);
            } else {
                await helperSrc.windowClose("document", itemDetail.name);

                const pathItemSelected = this.itemSelectedPath("workspace", itemDetail);

                await this.itemDelete("workspace", [pathItemSelected]);
            }
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
            if (!fileName) {
                const skillSelectListSlice = this.variableObject.skillSelectList.state.slice();

                const isDelete = await this.itemDelete("skill", skillSelectListSlice);

                for (const skillSelect of skillSelectListSlice) {
                    if (isDelete && skillSelect in agentObject) {
                        await this.agentSkillClear(agentObject[skillSelect]);
                    }
                }
            } else {
                const isDelete = await this.itemDelete("skill", [fileName]);

                if (isDelete) {
                    await this.agentSkillClear(agentList);
                }
            }
        }
    };

    private onClickCheckbox = (mode: string, itemDetail: modelMcp.IitemDetail): void => {
        let selectList: string[] = [];

        if (mode === "workspace") {
            selectList = this.variableObject.workspaceSelectList.state;
        } else if (mode === "skill") {
            selectList = this.variableObject.skillSelectList.state;
        }

        const pathItemSelected = this.itemSelectedPath(mode, itemDetail);

        if (!selectList.includes(pathItemSelected)) {
            selectList.push(pathItemSelected);
        } else {
            const index = selectList.indexOf(pathItemSelected);

            if (index !== -1) {
                selectList.splice(index, 1);
            }
        }

        this.updateSelectList(mode, selectList);
    };

    private onClickMenuWorkspace = async (): Promise<void> => {
        if (this.isMenuItemLoading) {
            return;
        }

        if (this.variableObject.isMenuItemWorkspace.state) {
            this.variableObject.isMenuItemWorkspace.state = false;

            return;
        }

        this.isMenuItemLoading = true;

        this.variableObject.workspaceCurrentFolderList.state = [];

        await this.paginationLoad("workspace", true);

        this.variableObject.isMenuItemWorkspace.state = true;
        this.variableObject.isMenuItemTool.state = false;
        this.variableObject.isMenuItemTask.state = false;
        this.variableObject.isMenuItemAgent.state = false;
        this.variableObject.isMenuItemSkill.state = false;
        this.variableObject.isMenuItemUser.state = false;
        this.variableObject.isMenuItemSetting.state = false;

        this.variableObject.agentData.state = {} as modelMcp.Iagent;
        this.variableObject.isAgentSkillSelect.state = false;

        this.isMenuItemLoading = false;
    };

    private onClickWorkspaceUpload = async (): Promise<void> => {
        this.variableObject.isUploadRunning.state = true;

        await this.controllerMcp.apiWorkspaceUpload(this.variableObject.workspaceCurrentFolderList.state);

        await this.paginationLoad("workspace", false);

        this.variableObject.isUploadRunning.state = false;
    };

    private onClickWorkspaceDeleteItem = async (itemDetail: modelMcp.IitemDetail): Promise<void> => {
        await this.dialogMessageDeleteWorkspaceItem(itemDetail);
    };

    private onClickWorkspaceDeleteSelected = async (): Promise<void> => {
        await this.dialogMessageDeleteWorkspaceItem();
    };

    private onClickWorkspaceRename = async (event: Event, itemDetail: modelMcp.IitemDetail): Promise<void> => {
        event.stopPropagation();

        const indexOpen = this.variableObject.documentOpenList.state.indexOf(itemDetail.name);

        if (indexOpen !== -1) {
            await helperSrc.windowClose("document", itemDetail.name);

            this.variableObject.documentOpenList.state.splice(indexOpen, 1);
        }

        const pathItemSelected = this.itemSelectedPath("workspace", itemDetail);

        const indexSelect = this.variableObject.workspaceSelectList.state.indexOf(pathItemSelected);

        if (indexSelect !== -1) {
            this.variableObject.workspaceSelectList.state.splice(indexSelect, 1);

            if (this.variableObject.workspaceSelectList.state.length === 0) {
                this.variableObject.isWorkspaceFolderMoveSelecting.state = false;
            }
        }

        this.variableObject.workspaceRenameSelected.state = pathItemSelected;
    };

    private onClickWorkspaceFolderCreate = (): void => {
        if (!this.variableObject.isWorkspaceFolderStillCreate.state) {
            this.variableObject.isWorkspaceFolderStillCreate.state = true;

            this.variableObject.workspaceItemList.state.unshift({
                name: "",
                extension: "",
                category: "folder"
            } as modelMcp.IitemDetail);
        }
    };

    private onClickWorkspaceFolderBack = async (): Promise<void> => {
        this.variableObject.workspaceCurrentFolderList.state.pop();

        await this.paginationLoad("workspace", true);
    };

    private onClickWorkspaceFolderMoveTo = (): void => {
        this.variableObject.isWorkspaceFolderMoveSelecting.state = !this.variableObject.isWorkspaceFolderMoveSelecting.state;
    };

    private onClickWorkspaceFolderHere = async (): Promise<void> => {
        this.variableObject.isWorkspaceFolderMoveRunning.state = true;

        const isFolderMove = await this.controllerMcp.apiWorkspaceFolderMove(
            this.variableObject.workspaceSelectList.state,
            this.variableObject.workspaceCurrentFolderList.state
        );

        if (isFolderMove) {
            await this.paginationLoad("workspace", false);

            this.updateSelectList("workspace", []);
        }

        this.variableObject.isWorkspaceFolderMoveRunning.state = false;
    };

    private onClickWorkspaceOpen = async (fileName: string, category: string): Promise<void> => {
        if (category === "folder") {
            this.variableObject.workspaceCurrentFolderList.state.push(fileName);

            await this.paginationLoad("workspace", true);
        } else {
            await this.windowOpenDocument(fileName);
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

    private onClickMenuSkill = async (): Promise<void> => {
        if (this.isMenuItemLoading) {
            return;
        }

        if (this.variableObject.isMenuItemSkill.state) {
            this.variableObject.isMenuItemSkill.state = false;

            return;
        }

        this.isMenuItemLoading = true;

        await this.paginationLoad("skill", true);

        this.variableObject.isMenuItemWorkspace.state = false;
        this.variableObject.isMenuItemTool.state = false;
        this.variableObject.isMenuItemTask.state = false;
        this.variableObject.isMenuItemAgent.state = false;
        this.variableObject.isMenuItemSkill.state = true;
        this.variableObject.isMenuItemUser.state = false;
        this.variableObject.isMenuItemSetting.state = false;

        this.variableObject.agentData.state = {} as modelMcp.Iagent;
        this.variableObject.isAgentSkillSelect.state = false;

        this.isMenuItemLoading = false;
    };

    private onClickSkillUpload = async (): Promise<void> => {
        this.variableObject.isUploadRunning.state = true;

        await this.controllerMcp.apiSkillUpload();

        await this.paginationLoad("skill", false);

        this.variableObject.isUploadRunning.state = false;
    };

    private onClickSkillDelete = (fileName: string): void => {
        this.controllerMcp.apiAgent().then(async (resultApiList) => {
            await this.dialogMessageDeleteSkill(resultApiList, fileName);
        });
    };

    private onClickSkillDeleteSelected = (): void => {
        this.controllerMcp.apiAgent().then(async (resultApiList) => {
            await this.dialogMessageDeleteSkill(resultApiList);
        });
    };

    private onClickSelectSkill = async (): Promise<void> => {
        this.variableObject.agentData.state.name = this.hookObject.elementInputAgentName.value;
        this.variableObject.agentData.state.description = this.hookObject.elementInputAgentDescription.value;

        await this.paginationLoad("skill", true);

        this.variableObject.isAgentSkillSelect.state = true;
    };

    private onClickSkillSelect = (fileName: string): void => {
        this.variableObject.agentData.state.skillName = fileName;

        this.variableObject.isAgentSkillSelect.state = false;
    };

    private onClickSelectSkillBack = (): void => {
        this.variableObject.isAgentSkillSelect.state = false;
    };

    private onClickMenuTool = (): void => {
        if (this.isMenuItemLoading) {
            return;
        }

        this.variableObject.isMenuItemWorkspace.state = false;
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
        if (this.isMenuItemLoading) {
            return;
        }

        this.variableObject.isMenuItemWorkspace.state = false;
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

    private onClickMenuAgent = async (): Promise<void> => {
        if (this.isMenuItemLoading) {
            return;
        }

        if (this.variableObject.isMenuItemAgent.state) {
            this.variableObject.isMenuItemAgent.state = false;

            return;
        }

        this.isMenuItemLoading = true;

        await this.controllerMcp.apiAgent();

        this.variableObject.isMenuItemWorkspace.state = false;
        this.variableObject.isMenuItemTool.state = false;
        this.variableObject.isMenuItemTask.state = false;
        this.variableObject.isMenuItemAgent.state = true;
        this.variableObject.isMenuItemSkill.state = false;
        this.variableObject.isMenuItemUser.state = false;
        this.variableObject.isMenuItemSetting.state = false;

        this.variableObject.agentData.state = {} as modelMcp.Iagent;
        this.variableObject.isAgentSkillSelect.state = false;

        this.isMenuItemLoading = false;
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

    private onClickAgentSave = async (): Promise<void> => {
        this.variableObject.isAgentSave.state = true;

        this.variableObject.agentData.state.name = this.hookObject.elementInputAgentName.value;
        this.variableObject.agentData.state.description = this.hookObject.elementInputAgentDescription.value;

        let isSave = false;

        if (this.variableObject.agentData.state.id === -1) {
            isSave = await this.controllerMcp.apiAgentCreate(this.variableObject.agentData.state);
        } else {
            isSave = await this.controllerMcp.apiAgentUpdate(this.variableObject.agentData.state);
        }

        if (isSave) {
            await this.controllerMcp.apiAgent();
        }

        this.variableObject.isAgentSave.state = false;
    };

    private onClickAgentCancel = (): void => {
        this.controllerMcp.apiAgent().then(() => {
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

    private onClickMenuUser = async (): Promise<void> => {
        if (this.isMenuItemLoading) {
            return;
        }

        if (this.variableObject.isMenuItemUser.state) {
            this.variableObject.isMenuItemUser.state = false;

            return;
        }

        this.isMenuItemLoading = true;

        await this.controllerMcp.apiUserQuery();

        this.variableObject.isMenuItemWorkspace.state = false;
        this.variableObject.isMenuItemTool.state = false;
        this.variableObject.isMenuItemTask.state = false;
        this.variableObject.isMenuItemAgent.state = false;
        this.variableObject.isMenuItemSkill.state = false;
        this.variableObject.isMenuItemUser.state = true;
        this.variableObject.isMenuItemSetting.state = false;

        this.variableObject.agentData.state = {} as modelMcp.Iagent;
        this.variableObject.isAgentSkillSelect.state = false;

        this.isMenuItemLoading = false;
    };

    private onClickUserUpdate = async (): Promise<void> => {
        this.variableObject.isUserUpdate.state = true;

        const userCopy = { ...this.variableObject.user.state };

        userCopy.name = this.hookObject.elementInputUserName.value;
        userCopy.surname = this.hookObject.elementInputUserSurname.value;

        if (this.variableObject.loginMode.state === "basic") {
            userCopy.password = this.hookObject.elementInputUserPassword.value;
        }

        const isUpdate = await this.controllerMcp.apiUserUpdate(userCopy);

        if (isUpdate) {
            await this.controllerMcp.apiUserQuery();
        }

        this.variableObject.isUserUpdate.state = false;
    };

    private onClickUserCancel = (): void => {
        this.variableObject.isMenuItemUser.state = false;
    };

    private onClickSettingSave = async (): Promise<void> => {
        this.variableObject.isSettingSave.state = true;

        const llmServiceId = parseInt(this.hookObject.elementSelectSettingLlmServiceId.value);

        const settingCopy: modelMcp.Isetting = {
            id: this.variableObject.setting.state.id,
            llmList: []
        };

        for (const llm of this.variableObject.setting.state.llmList) {
            settingCopy.llmList.push({
                ...llm,
                url: llm.id === llmServiceId ? this.hookObject.elementInputSettingLlmUrl.value : llm.url,
                apiKey: llm.id === llmServiceId ? this.hookObject.elementInputSettingLlmApiKey.value : llm.apiKey,
                selected: llm.id === llmServiceId ? true : false
            });
        }

        const isUpdate = await this.controllerMcp.apiSettingUpdate(settingCopy);

        if (isUpdate) {
            await this.controllerMcp.apiSettingQuery();
        }

        this.variableObject.isSettingSave.state = false;
    };

    private onClickSettingCancel = (): void => {
        this.variableObject.isMenuItemSetting.state = false;
    };

    private onClickMenuSetting = async (): Promise<void> => {
        if (this.isMenuItemLoading) {
            return;
        }

        if (this.variableObject.isMenuItemSetting.state) {
            this.variableObject.isMenuItemSetting.state = false;

            return;
        }

        this.isMenuItemLoading = true;

        await this.controllerMcp.apiSettingQuery();

        this.variableObject.isMenuItemWorkspace.state = false;
        this.variableObject.isMenuItemTool.state = false;
        this.variableObject.isMenuItemTask.state = false;
        this.variableObject.isMenuItemAgent.state = false;
        this.variableObject.isMenuItemSkill.state = false;
        this.variableObject.isMenuItemUser.state = false;
        this.variableObject.isMenuItemSetting.state = true;

        this.variableObject.agentData.state = {} as modelMcp.Iagent;
        this.variableObject.isAgentSkillSelect.state = false;

        this.isMenuItemLoading = false;
    };

    private onClickToggleSelectAll = (mode: string): void => {
        let itemDetailList: modelMcp.IitemDetail[] = [];
        let selectList: string[] = [];

        if (mode === "workspace") {
            itemDetailList = this.variableObject.workspaceItemList.state;
            selectList = this.variableObject.workspaceSelectList.state;
        } else if (mode === "skill") {
            itemDetailList = this.variableObject.skillList.state;
            selectList = this.variableObject.skillSelectList.state;
        }

        if (!this.selectAllCheck(mode)) {
            for (const itemDetail of itemDetailList) {
                const pathItemSelected = this.itemSelectedPath(mode, itemDetail);

                if (!selectList.includes(pathItemSelected)) {
                    selectList.push(pathItemSelected);
                }
            }
        } else {
            for (const itemDetail of itemDetailList) {
                const pathItemSelected = this.itemSelectedPath(mode, itemDetail);

                const index = selectList.indexOf(pathItemSelected);

                if (index !== -1) {
                    selectList.splice(index, 1);
                }
            }
        }

        this.updateSelectList(mode, selectList);
    };

    private onInputWorkspaceFolderName = async (event: KeyboardEvent): Promise<void> => {
        if (event.key === "Enter") {
            await this.workspaceCreateFolder();
        }
    };

    private onInputWorkspaceRename = async (event: KeyboardEvent): Promise<void> => {
        if (event.key === "Enter") {
            await this.workspaceRename();
        }
    };

    private onChangeSettingLlmServiceId = (): void => {
        this.variableObject.settingLlmServiceId.state = parseInt(this.hookObject.elementSelectSettingLlmServiceId.value);
    };

    private menuReset = (): void => {
        this.variableObject.isMenuItemWorkspace.state = false;
        this.variableObject.isMenuItemTool.state = false;
        this.variableObject.isMenuItemTask.state = false;
        this.variableObject.isMenuItemAgent.state = false;
        this.variableObject.isMenuItemSkill.state = false;
        this.variableObject.isMenuItemUser.state = false;
        this.variableObject.isMenuItemSetting.state = false;

        this.variableObject.workspaceCurrentFolderList.state = [];
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
                loginMode: variableLink<string>("Mcp"),
                isLogin: variableLink<boolean>("Mcp"),
                isOfflineMcp: variableLink<boolean>("Mcp"),
                isMenuItemWorkspace: false,
                isMenuItemTool: false,
                isMenuItemTask: false,
                isMenuItemAgent: false,
                isMenuItemSkill: false,
                isMenuItemUser: false,
                isMenuItemSetting: false,
                documentOpenList: [],
                workspaceItemList: variableLink<modelMcp.IitemDetail[]>("Mcp"),
                workspaceSelectList: [],
                workspaceCurrentFolderList: [],
                workspaceRenameSelected: "",
                isUploadRunning: false,
                isDeleteRunning: false,
                isWorkspaceFolderStillCreate: false,
                isWorkspaceFolderCreateRunning: false,
                isWorkspaceFolderMoveSelecting: false,
                isWorkspaceFolderMoveRunning: false,
                isRagRunning: false,
                isRagGraphOpen: false,
                isRagGraphHtmlLoading: false,
                ragGraphHtml: "",
                skillList: variableLink<modelMcp.IitemDetail[]>("Mcp"),
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
            selectAllCheck: this.selectAllCheck,
            checkProcessOngoing: this.checkProcessOngoing,
            checkRenameSelected: this.checkRenameSelected,
            checkItemSelected: this.checkItemSelected,
            itemId: this.itemId,
            onClickCheckbox: this.onClickCheckbox,
            onClickMenuWorkspace: this.onClickMenuWorkspace,
            onClickWorkspaceUpload: this.onClickWorkspaceUpload,
            onClickWorkspaceDeleteItem: this.onClickWorkspaceDeleteItem,
            onClickWorkspaceDeleteSelected: this.onClickWorkspaceDeleteSelected,
            onClickWorkspaceRename: this.onClickWorkspaceRename,
            onClickWorkspaceFolderCreate: this.onClickWorkspaceFolderCreate,
            onClickWorkspaceFolderBack: this.onClickWorkspaceFolderBack,
            onClickWorkspaceFolderMoveTo: this.onClickWorkspaceFolderMoveTo,
            onClickWorkspaceFolderHere: this.onClickWorkspaceFolderHere,
            onClickWorkspaceOpen: this.onClickWorkspaceOpen,
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
            onClickSettingSave: this.onClickSettingSave,
            onClickSettingCancel: this.onClickSettingCancel,
            onClickMenuSetting: this.onClickMenuSetting,
            onClickToggleSelectAll: this.onClickToggleSelectAll,
            onInputWorkspaceFolderName: this.onInputWorkspaceFolderName,
            onInputWorkspaceRename: this.onInputWorkspaceRename,
            onChangeSettingLlmServiceId: this.onChangeSettingLlmServiceId
        };
    }

    variableEffect(watch: IvariableEffect): void {
        watch([
            {
                variableList: ["pageNumber"],
                action: () => {
                    this.paginationSlice(this.paginationMode());
                }
            },
            {
                variableList: ["isLogin"],
                action: () => {
                    if (this.variableObject.isLogin.state) {
                        this.menuReset();
                    }
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

            if (
                this.variableObject.isWorkspaceFolderStillCreate.state &&
                !helperSrc.findElementParent(target, "input_folder_name") &&
                !helperSrc.findElementParent(target, "button_create_folder")
            ) {
                await this.workspaceCreateFolder();
            } else if (this.variableObject.workspaceRenameSelected.state !== "" && !helperSrc.findElementParent(target, "input_rename")) {
                await this.workspaceRename();
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
