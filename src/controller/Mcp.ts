import { Icontroller, IvirtualNode, variableBind, variableLink, IvariableEffect } from "@cimo/jsmvcfw/dist/src/Main.js";
import { open } from "@tauri-apps/plugin-dialog";
import { readFile } from "@tauri-apps/plugin-fs";
import { fetch } from "@tauri-apps/plugin-http";

// Source
import * as session from "../Session";
import * as helperSrc from "../HelperSrc";
import * as modelHelperSrc from "../model/HelperSrc.js";
import * as modelMcp from "../model/Mcp";
import * as modelChat from "../model/Chat";
import * as viewMcp from "../view/Mcp";
import type Toast from "./Toast";

export default class Mcp implements Icontroller {
    // Variable
    private variableObject: modelMcp.Ivariable;
    private methodObject: modelMcp.Imethod;
    private viewNodeEmpty: IvirtualNode;
    private controllerToast: Toast;

    // Method
    private showFileFailedMessage = async (actionOperationList: modelHelperSrc.IactionOperation[]): Promise<void> => {
        const messageList: string[] = [];

        for (const actionOperation of actionOperationList) {
            if ((actionOperation.state === "ko" || actionOperation.state === "failed") && actionOperation.data) {
                const fileDetail = await helperSrc.fileDetail(actionOperation.data as string);

                if (typeof actionOperation.message !== "string") {
                    for (const message of actionOperation.message) {
                        messageList.push(`${fileDetail.name} - ${message}`);
                    }
                } else {
                    messageList.push(`${fileDetail.name} - ${actionOperation.message}`);
                }
            }
        }

        this.controllerToast.show("error", messageList, 0);
    };

    private apiRagCheck = (actionOperationList: modelHelperSrc.IactionOperation[], index: number): void => {
        const pathFile = actionOperationList[index].data as string;

        let isIntervalRunning = false;

        const interval = setInterval(async () => {
            if (isIntervalRunning) {
                return;
            }

            isIntervalRunning = true;

            if (pathFile) {
                const body: modelMcp.IapiRagCheckBody = { pathFile };

                await fetch(`${helperSrc.URL_MCP}/api/rag-check`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "mcp-session-id": session.data.mcpSessionId,
                        "mcp-cookie": session.data.mcpCookie
                    },
                    body: JSON.stringify(body),
                    danger: {
                        acceptInvalidCerts: true,
                        acceptInvalidHostnames: true
                    }
                })
                    .then(async (resultApi) => {
                        this.variableObject.isOfflineMcp.state = false;

                        const json = (await resultApi.json()) as modelHelperSrc.IapiResponse;

                        actionOperationList[index].state = json.response.state;
                        actionOperationList[index].message = json.response.message;

                        if (json.response.state !== "ongoing") {
                            if (interval) {
                                clearInterval(interval);
                            }

                            for (let a = 0; a < actionOperationList.length; a++) {
                                if (actionOperationList[a].state === "ongoing") {
                                    this.variableObject.isRagRunning.state = true;

                                    break;
                                }

                                if (a === actionOperationList.length - 1) {
                                    this.variableObject.isRagRunning.state = false;
                                }
                            }
                        }

                        await this.showFileFailedMessage(actionOperationList);
                    })
                    .catch((error: Error) => {
                        helperSrc.writeLog("Mcp.ts - apiRagCheck() - fetch() - catch()", error.message);

                        this.variableObject.isOfflineMcp.state = true;
                    });
            }

            isIntervalRunning = false;
        }, 1000);
    };

    private apiPlaywrightLogin = async (): Promise<void> => {
        return fetch(`${helperSrc.URL_MS_AUTOMATE_TEST}/login`, {
            method: "GET",
            maxRedirections: 0,
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        })
            .then((resultApi) => {
                const cookie = resultApi.headers.get("set-cookie");

                if (cookie) {
                    session.writeMsAutomateTestSession(cookie.split(";")[0]);
                }
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiPlaywrightLogin() - catch()", error);
            });
    };

    private apiPlaywrightVideoBlobUrl = async (fileName: string): Promise<string | void> => {
        return fetch(`${helperSrc.URL_MS_AUTOMATE_TEST}/file/${fileName}`, {
            method: "GET",
            headers: {
                Cookie: session.data.msAutomateTestCookie
            },
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        })
            .then(async (resultApi) => {
                const blob = await resultApi.blob();

                return URL.createObjectURL(blob);
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiPlaywrightVideoBlobUrl() - catch()", error);
            });
    };

    private apiPlaywrightLogout = async (): Promise<void> => {
        return fetch(`${helperSrc.URL_MS_AUTOMATE_TEST}/logout`, {
            method: "GET",
            headers: {
                Cookie: session.data.msAutomateTestCookie
            },
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        })
            .then(() => {
                session.deleteMsAutomateTestSession();
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiPlaywrightLogout() - fetch() - catch()", error);
            });
    };

    private onClickChipClose = (): void => {
        this.variableObject.toolSelected.state = {} as modelMcp.Itool;
        this.variableObject.taskSelected.state = {} as modelMcp.Itask;
        this.variableObject.agentSelected.state = {} as modelMcp.Iagent;

        if (session.data.msAutomateTestCookie) {
            this.apiPlaywrightLogout().then(() => {
                this.variableObject.playwrightVideoSrc.state = "";
            });
        }

        this.variableObject.systemMode.state = "chat";
    };

    showToastMessage = (mode: string, message: string | string[]): void => {
        let messageList: string[] = [];

        if (typeof message !== "string") {
            messageList = message;
        } else if (message !== "") {
            messageList = [message];
        }

        this.controllerToast.show(mode, messageList);
    };

    apiLogin = async (mode: string, username?: string, password?: string): Promise<boolean> => {
        let body = {} as modelMcp.IapiLoginBody;

        if (mode === "basic") {
            body = {
                mode,
                username,
                password
            };
        } else if (mode === "ad") {
            body = { mode };
        }

        if (!session.data.mcpBearerToken) {
            session.data.mcpBearerToken = helperSrc.generateUniqueId();
        }

        return fetch(`${helperSrc.URL_MCP}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "mcp-session-id": session.data.mcpSessionId,
                "mcp-bearer-token": session.data.mcpBearerToken
            },
            body: JSON.stringify(body),
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        })
            .then(async (resultApi) => {
                let isResult = false;

                this.variableObject.isOfflineMcp.state = false;

                const cookie = resultApi.headers.get("set-cookie");

                if (cookie) {
                    const json = (await resultApi.json()) as modelHelperSrc.IapiResponse;

                    if (json.response.state === "ko") {
                        this.variableObject.isLogin.state = false;

                        this.showToastMessage("error", json.response.message);
                    } else {
                        let mcpSessionId = "";

                        if (mode === "basic") {
                            mcpSessionId = json.response.data as string;

                            this.variableObject.isLogin.state = true;
                        } else if (mode === "ad") {
                            this.variableObject.adUrl.state = json.response.data as string;
                        }

                        this.variableObject.loginMode.state = mode;

                        session.writeMcpSession(mcpSessionId, cookie, session.data.mcpBearerToken);

                        isResult = true;
                    }
                }

                return isResult;
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiLogin() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;

                return false;
            });
    };

    apiAdVerify = async (): Promise<string> => {
        return fetch(`${helperSrc.URL_MCP}/ad-verify`, {
            method: "GET",
            headers: {
                "mcp-cookie": session.data.mcpCookie,
                "mcp-bearer-token": session.data.mcpBearerToken
            },
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        })
            .then(async (resultApi) => {
                this.variableObject.isOfflineMcp.state = false;

                const json = (await resultApi.json()) as modelHelperSrc.IapiResponse;

                if (json.response.state === "ko") {
                    this.variableObject.isLogin.state = false;

                    this.showToastMessage("error", json.response.message);
                } else {
                    if (json.response.state === "ongoing") {
                        this.variableObject.isLogin.state = false;
                    } else if (json.response.state === "ok") {
                        session.writeMcpSession(json.response.data as string, session.data.mcpCookie, session.data.mcpBearerToken);

                        this.variableObject.isLogin.state = true;
                    }
                }

                return json.response.state;
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiAdVerify() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;

                return "ko";
            });
    };

    apiLogout = async (): Promise<void | Response> => {
        return fetch(`${helperSrc.URL_MCP}/logout`, {
            method: "GET",
            headers: {
                "mcp-session-id": session.data.mcpSessionId,
                "mcp-cookie": session.data.mcpCookie,
                "mcp-bearer-token": session.data.mcpBearerToken
            },
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        })
            .then(async (resultApi) => {
                this.variableObject.isOfflineMcp.state = false;

                const json = (await resultApi.json()) as modelHelperSrc.IapiResponse;

                if (json.response.state === "ko") {
                    this.showToastMessage("error", json.response.message);
                } else {
                    session.deleteMcpSession();
                }
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiLogout() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;
            });
    };

    apiTool = async (): Promise<void> => {
        return fetch(`${helperSrc.URL_MCP}/api/tool-retrieve`, {
            method: "GET",
            headers: {
                "mcp-session-id": session.data.mcpSessionId,
                "mcp-cookie": session.data.mcpCookie
            },
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        })
            .then(async (resultApi) => {
                this.variableObject.isOfflineMcp.state = false;

                const json = (await resultApi.json()) as modelHelperSrc.IapiResponse;

                if (json.response.state === "ko") {
                    this.showToastMessage("error", json.response.message);

                    this.variableObject.toolList.state = [];
                } else {
                    this.variableObject.toolList.state = json.response.data as modelMcp.Itool[];
                }
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiTool() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;
            });
    };

    apiTask = async (): Promise<void> => {
        return fetch(`${helperSrc.URL_MCP}/api/task-retrieve`, {
            method: "GET",
            headers: {
                "mcp-session-id": session.data.mcpSessionId,
                "mcp-cookie": session.data.mcpCookie
            },
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        })
            .then(async (resultApi) => {
                this.variableObject.isOfflineMcp.state = false;

                const json = (await resultApi.json()) as modelHelperSrc.IapiResponse;

                if (json.response.state === "ko") {
                    this.showToastMessage("error", json.response.message);

                    this.variableObject.taskList.state = [];
                } else {
                    this.variableObject.taskList.state = json.response.data as modelMcp.Itask[];
                }
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiTask() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;
            });
    };

    apiWorkspace = async (currentFolderList: string[]): Promise<modelMcp.IitemDetail[]> => {
        const body: modelMcp.IapiWorkspaceBody = { folderJoin: currentFolderList.join("/") };

        return fetch(`${helperSrc.URL_MCP}/api/workspace-retrieve`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "mcp-session-id": session.data.mcpSessionId,
                "mcp-cookie": session.data.mcpCookie
            },
            body: JSON.stringify(body),
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        })
            .then(async (resultApi) => {
                this.variableObject.isOfflineMcp.state = false;

                const json = (await resultApi.json()) as modelHelperSrc.IapiResponse;

                if (json.response.state === "ko") {
                    this.showToastMessage("error", json.response.message);

                    this.variableObject.workspaceItemList.state = [];
                } else {
                    this.variableObject.workspaceItemList.state = json.response.data as modelMcp.IitemDetail[];
                }

                return this.variableObject.workspaceItemList.state;
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiWorkspace() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;

                return [];
            });
    };

    apiWorkspaceUpload = async (currentFolderList: string[]): Promise<void> => {
        const pathFileList = await open({
            multiple: true,
            directory: false
        });

        if (pathFileList) {
            const actionOperationList: modelHelperSrc.IactionOperation[] = [];

            for (let a = 0; a < pathFileList.length; a++) {
                const pathFile = pathFileList[a];

                const file = await readFile(pathFile);
                const fileDetail = await helperSrc.fileDetail(pathFile, file);

                const blob = new Blob([file], { type: fileDetail.mimeType });

                const formData = new FormData();
                formData.append("file", blob, encodeURIComponent(fileDetail.name));

                await fetch(`${helperSrc.URL_MCP}/api/workspace-upload`, {
                    method: "POST",
                    headers: {
                        "mcp-session-id": session.data.mcpSessionId,
                        "mcp-cookie": session.data.mcpCookie,
                        fileNameEncode: encodeURIComponent(fileDetail.name),
                        folderJoin: currentFolderList.join("/")
                    },
                    body: formData,
                    danger: {
                        acceptInvalidCerts: true,
                        acceptInvalidHostnames: true
                    }
                })
                    .then(async (resultApi) => {
                        this.variableObject.isOfflineMcp.state = false;

                        const json = (await resultApi.json()) as modelHelperSrc.IapiResponse;

                        actionOperationList.push(json.response);

                        await this.showFileFailedMessage(actionOperationList);
                    })
                    .catch((error: Error) => {
                        helperSrc.writeLog("Mcp.ts - apiWorkspaceUpload() - fetch() - catch()", error.message);

                        this.variableObject.isOfflineMcp.state = true;
                    });
            }
        }
    };

    apiWorkspaceRead = async (fileName: string): Promise<string> => {
        const body: modelMcp.IapiWorkspaceReadBody = { fileName };

        return fetch(`${helperSrc.URL_MCP}/api/workspace-read`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "mcp-session-id": session.data.mcpSessionId,
                "mcp-cookie": session.data.mcpCookie
            },
            body: JSON.stringify(body),
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        })
            .then(async (resultApi) => {
                let result = "";

                this.variableObject.isOfflineMcp.state = false;

                const json = (await resultApi.json()) as modelHelperSrc.IapiResponse;

                if (json.response.state === "ko") {
                    this.showToastMessage("error", json.response.message);
                } else {
                    result = json.response.data as string;
                }

                return result;
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiWorkspaceRead() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;

                return "";
            });
    };

    apiWorkspaceDelete = async (selectList: string[]): Promise<boolean> => {
        const body: modelMcp.IapiWorkspaceDeleteBody = { pathList: selectList };

        return fetch(`${helperSrc.URL_MCP}/api/workspace-delete`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "mcp-session-id": session.data.mcpSessionId,
                "mcp-cookie": session.data.mcpCookie
            },
            body: JSON.stringify(body),
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        })
            .then(async (resultApi) => {
                let isResult = false;

                this.variableObject.isOfflineMcp.state = false;

                const json = (await resultApi.json()) as modelHelperSrc.IapiResponse;

                if (json.response.state === "ko") {
                    this.showToastMessage("error", json.response.message);
                } else {
                    isResult = true;
                }

                return isResult;
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiWorkspaceDelete() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;

                return false;
            });
    };

    apiWorkspaceRename = async (pathItem: string, name: string): Promise<boolean> => {
        const body: modelMcp.IapiWorkspaceRenameBody = { pathItem, name };

        return fetch(`${helperSrc.URL_MCP}/api/workspace-rename`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "mcp-session-id": session.data.mcpSessionId,
                "mcp-cookie": session.data.mcpCookie
            },
            body: JSON.stringify(body),
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        })
            .then(async (resultApi) => {
                let isResult = false;

                this.variableObject.isOfflineMcp.state = false;

                const json = (await resultApi.json()) as modelHelperSrc.IapiResponse;

                if (json.response.state === "ko") {
                    this.showToastMessage("error", json.response.message);
                } else {
                    isResult = true;
                }

                return isResult;
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiWorkspaceRename() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;

                return false;
            });
    };

    apiWorkspaceFolderCreate = async (folderName: string, currentFolderList: string[]): Promise<boolean> => {
        const body: modelMcp.IapiWorkspaceFolderCreateBody = { folderName, folderJoin: currentFolderList.join("/") };

        return fetch(`${helperSrc.URL_MCP}/api/workspace-folder-create`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "mcp-session-id": session.data.mcpSessionId,
                "mcp-cookie": session.data.mcpCookie
            },
            body: JSON.stringify(body),
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        })
            .then(async (resultApi) => {
                let isResult = false;

                this.variableObject.isOfflineMcp.state = false;

                const json = (await resultApi.json()) as modelHelperSrc.IapiResponse;

                if (json.response.state === "ko") {
                    this.showToastMessage("error", json.response.message);
                } else {
                    isResult = true;
                }

                return isResult;
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiWorkspaceFolderCreate() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;

                return false;
            });
    };

    apiWorkspaceFolderMove = async (selectList: string[], currentFolderList: string[]): Promise<boolean> => {
        const body: modelMcp.IapiWorkspaceFolderMoveBody = { pathList: selectList, folderJoin: currentFolderList.join("/") };

        return fetch(`${helperSrc.URL_MCP}/api/workspace-folder-move`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "mcp-session-id": session.data.mcpSessionId,
                "mcp-cookie": session.data.mcpCookie
            },
            body: JSON.stringify(body),
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        })
            .then(async (resultApi) => {
                let isResult = false;

                this.variableObject.isOfflineMcp.state = false;

                const json = (await resultApi.json()) as modelHelperSrc.IapiResponse;

                if (json.response.state === "ko") {
                    this.showToastMessage("error", json.response.message);
                } else {
                    isResult = true;
                }

                return isResult;
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiWorkspaceFolderMove() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;

                return false;
            });
    };

    apiRagStart = (): void => {
        this.variableObject.isRagRunning.state = true;

        const actionOperationList: modelHelperSrc.IactionOperation[] = [];

        fetch(`${helperSrc.URL_MCP}/api/rag-start`, {
            method: "POST",
            headers: {
                "mcp-session-id": session.data.mcpSessionId,
                Cookie: session.data.mcpCookie
            },
            body: "",
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        })
            .then(async (resultApi) => {
                this.variableObject.isOfflineMcp.state = false;

                const json = (await resultApi.json()) as modelHelperSrc.IapiResponse;

                if (json.response.state === "ko") {
                    this.showToastMessage("error", json.response.message);

                    this.variableObject.isRagRunning.state = false;
                } else {
                    const pathFileList = json.response.data as string[];

                    for (let a = 0; a < pathFileList.length; a++) {
                        actionOperationList.push({ state: "ongoing", message: "", data: pathFileList[a] });

                        this.apiRagCheck(actionOperationList, a);
                    }
                }
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiRagStart() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;

                this.variableObject.isRagRunning.state = false;
            });
    };

    apiRagGraph = async (): Promise<string> => {
        return fetch(`${helperSrc.URL_MCP}/api/rag-graph`, {
            method: "GET",
            headers: {
                "mcp-session-id": session.data.mcpSessionId,
                Cookie: session.data.mcpCookie
            },
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        })
            .then(async (resultApi) => {
                let result = "";

                this.variableObject.isOfflineMcp.state = false;

                const json = (await resultApi.json()) as modelHelperSrc.IapiResponse;

                if (json.response.state === "ko") {
                    this.showToastMessage("error", json.response.message);
                } else {
                    result = json.response.data as string;
                }

                return result;
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiRagGraph() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;

                return "";
            });
    };

    apiSkill = async (): Promise<modelMcp.IitemDetail[]> => {
        return fetch(`${helperSrc.URL_MCP}/api/skill-retrieve`, {
            method: "GET",
            headers: {
                "mcp-session-id": session.data.mcpSessionId,
                "mcp-cookie": session.data.mcpCookie
            },
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        })
            .then(async (resultApi) => {
                this.variableObject.isOfflineMcp.state = false;

                const json = (await resultApi.json()) as modelHelperSrc.IapiResponse;

                if (json.response.state === "ko") {
                    this.showToastMessage("error", json.response.message);

                    this.variableObject.skillList.state = [];
                } else {
                    this.variableObject.skillList.state = json.response.data as modelMcp.IitemDetail[];
                }

                return this.variableObject.skillList.state;
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiSkill() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;

                return [];
            });
    };

    apiSkillUpload = async (): Promise<void> => {
        const pathFileList = await open({
            multiple: true,
            directory: false
        });

        if (pathFileList) {
            const actionOperationList: modelHelperSrc.IactionOperation[] = [];

            for (let a = 0; a < pathFileList.length; a++) {
                const pathFile = pathFileList[a];

                const file = await readFile(pathFile);
                const fileDetail = await helperSrc.fileDetail(pathFile, file);
                const blob = new Blob([file], { type: fileDetail.mimeType });

                const formData = new FormData();
                formData.append("file", blob, encodeURIComponent(fileDetail.name));

                await fetch(`${helperSrc.URL_MCP}/api/skill-upload`, {
                    method: "POST",
                    headers: {
                        "mcp-session-id": session.data.mcpSessionId,
                        "mcp-cookie": session.data.mcpCookie,
                        fileNameEncode: encodeURIComponent(fileDetail.name)
                    },
                    body: formData,
                    danger: {
                        acceptInvalidCerts: true,
                        acceptInvalidHostnames: true
                    }
                })
                    .then(async (resultApi) => {
                        this.variableObject.isOfflineMcp.state = false;

                        const json = (await resultApi.json()) as modelHelperSrc.IapiResponse;

                        actionOperationList.push(json.response);

                        await this.showFileFailedMessage(actionOperationList);
                    })
                    .catch((error: Error) => {
                        helperSrc.writeLog("Mcp.ts - apiSkillUpload() - fetch() - catch()", error.message);

                        this.variableObject.isOfflineMcp.state = true;
                    });
            }
        }
    };

    apiSkillRead = async (fileName: string): Promise<string> => {
        const body: modelMcp.IapiSkillReadBody = { fileName };

        return fetch(`${helperSrc.URL_MCP}/api/skill-read`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "mcp-session-id": session.data.mcpSessionId,
                "mcp-cookie": session.data.mcpCookie
            },
            body: JSON.stringify(body),
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        })
            .then(async (resultApi) => {
                let result = "";

                this.variableObject.isOfflineMcp.state = false;

                const json = (await resultApi.json()) as modelHelperSrc.IapiResponse;

                if (json.response.state === "ko") {
                    this.showToastMessage("error", json.response.message);
                } else {
                    result = json.response.data as string;
                }

                return result;
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiSkillRead() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;

                return "";
            });
    };

    apiSkillDelete = async (selectList: string[]): Promise<boolean> => {
        const body: modelMcp.IapiSkillDeleteBody = { fileNameList: selectList };

        return fetch(`${helperSrc.URL_MCP}/api/skill-delete`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "mcp-session-id": session.data.mcpSessionId,
                "mcp-cookie": session.data.mcpCookie
            },
            body: JSON.stringify(body),
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        })
            .then(async (resultApi) => {
                let isResult = false;

                this.variableObject.isOfflineMcp.state = false;

                const json = (await resultApi.json()) as modelHelperSrc.IapiResponse;

                if (json.response.state === "ko") {
                    this.showToastMessage("error", json.response.message);
                } else {
                    isResult = true;
                }

                return isResult;
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiSkillDelete() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;

                return false;
            });
    };

    apiAgent = async (): Promise<modelMcp.Iagent[]> => {
        return fetch(`${helperSrc.URL_MCP}/api/agent-retrieve`, {
            method: "GET",
            headers: {
                "mcp-session-id": session.data.mcpSessionId,
                "mcp-cookie": session.data.mcpCookie
            },
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        })
            .then(async (resultApi) => {
                this.variableObject.isOfflineMcp.state = false;

                const json = (await resultApi.json()) as modelHelperSrc.IapiResponse;

                if (json.response.state === "ko") {
                    this.showToastMessage("error", json.response.message);

                    this.variableObject.agentList.state = [];
                } else {
                    this.variableObject.agentList.state = json.response.data as modelMcp.Iagent[];
                }

                if (Object.keys(this.variableObject.agentSelected.state).length > 0) {
                    for (let a = 0; a < this.variableObject.agentList.state.length; a++) {
                        const agent = this.variableObject.agentList.state[a];

                        if (this.variableObject.agentSelected.state.id === agent.id) {
                            this.variableObject.agentSelected.state = agent;

                            break;
                        }
                    }
                }

                return this.variableObject.agentList.state;
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiAgent() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;

                return [];
            });
    };

    apiAgentCreate = async (agent: modelMcp.Iagent): Promise<void> => {
        const body: modelMcp.IapiAgentCreateBody = {
            name: agent.name,
            description: agent.description,
            skillName: agent.skillName
        };

        await fetch(`${helperSrc.URL_MCP}/api/agent-create`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "mcp-session-id": session.data.mcpSessionId,
                "mcp-cookie": session.data.mcpCookie
            },
            body: JSON.stringify(body),
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        })
            .then(async (resultApi) => {
                this.variableObject.isOfflineMcp.state = false;

                const json = (await resultApi.json()) as modelHelperSrc.IapiResponse;

                if (json.response.state === "ko") {
                    this.showToastMessage("error", json.response.message);
                } else {
                    this.apiAgent().then(() => {
                        this.variableObject.agentData.state = {} as modelMcp.Iagent;

                        this.showToastMessage("success", json.response.message);
                    });
                }
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiAgentCreate() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;
            });
    };

    apiAgentUpdate = async (agent: modelMcp.Iagent): Promise<void> => {
        const body: modelMcp.IapiAgentUpdateBody = {
            id: agent.id,
            name: agent.name,
            description: agent.description,
            skillName: agent.skillName
        };

        await fetch(`${helperSrc.URL_MCP}/api/agent-update`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "mcp-session-id": session.data.mcpSessionId,
                "mcp-cookie": session.data.mcpCookie
            },
            body: JSON.stringify(body),
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        })
            .then(async (resultApi) => {
                this.variableObject.isOfflineMcp.state = false;

                const json = (await resultApi.json()) as modelHelperSrc.IapiResponse;

                if (json.response.state === "ko") {
                    this.showToastMessage("error", json.response.message);
                } else {
                    this.apiAgent().then(() => {
                        this.variableObject.agentData.state = {} as modelMcp.Iagent;

                        this.showToastMessage("success", json.response.message);
                    });
                }
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiAgentUpdate() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;
            });
    };

    apiAgentDelete = async (index: number, id: number): Promise<boolean> => {
        const body: modelMcp.IapiAgentDeleteBody = { id };

        return fetch(`${helperSrc.URL_MCP}/api/agent-delete`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "mcp-session-id": session.data.mcpSessionId,
                "mcp-cookie": session.data.mcpCookie
            },
            body: JSON.stringify(body),
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        })
            .then(async (resultApi) => {
                let isResult = false;

                this.variableObject.isOfflineMcp.state = false;

                const json = (await resultApi.json()) as modelHelperSrc.IapiResponse;

                if (json.response.state === "ko") {
                    this.showToastMessage("error", json.response.message);
                } else {
                    const filteredList: modelMcp.Iagent[] = [];

                    for (let a = 0; a < this.variableObject.agentList.state.length; a++) {
                        if (a !== index) {
                            filteredList.push(this.variableObject.agentList.state[a]);
                        }
                    }

                    this.variableObject.agentList.state = filteredList;

                    isResult = true;
                }

                return isResult;
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiAgentDelete() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;

                return false;
            });
    };

    apiUserQuery = async (): Promise<void> => {
        return fetch(`${helperSrc.URL_MCP}/api/user-query`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "mcp-session-id": session.data.mcpSessionId,
                "mcp-cookie": session.data.mcpCookie
            },
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        })
            .then(async (resultApi) => {
                this.variableObject.isOfflineMcp.state = false;

                const json = (await resultApi.json()) as modelHelperSrc.IapiResponse;

                if (json.response.state === "ko") {
                    this.showToastMessage("error", json.response.message);

                    this.variableObject.user.state = {} as modelMcp.Iuser;
                } else {
                    this.variableObject.user.state = json.response.data as modelMcp.Iuser;
                }
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiUserQuery() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;
            });
    };

    apiUserUpdate = async (user: modelMcp.Iuser): Promise<void> => {
        const body: modelMcp.IapiUserUpdateBody = {
            id: user.id,
            name: user.name,
            surname: user.surname,
            password: user.password || ""
        };

        await fetch(`${helperSrc.URL_MCP}/api/user-update`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "mcp-session-id": session.data.mcpSessionId,
                "mcp-cookie": session.data.mcpCookie
            },
            body: JSON.stringify(body),
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        })
            .then(async (resultApi) => {
                this.variableObject.isOfflineMcp.state = false;

                const json = (await resultApi.json()) as modelHelperSrc.IapiResponse;

                if (json.response.state === "ko") {
                    this.showToastMessage("error", json.response.message);
                } else {
                    this.apiUserQuery().then(() => {
                        this.showToastMessage("success", json.response.message);
                    });
                }
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiUserUpdate() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;
            });
    };

    apiSettingQuery = async (): Promise<void> => {
        return fetch(`${helperSrc.URL_MCP}/api/setting-query`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "mcp-session-id": session.data.mcpSessionId,
                "mcp-cookie": session.data.mcpCookie
            },
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        })
            .then(async (resultApi) => {
                this.variableObject.isOfflineMcp.state = false;

                const json = (await resultApi.json()) as modelHelperSrc.IapiResponse;

                if (json.response.state === "ko") {
                    this.showToastMessage("error", json.response.message);

                    this.variableObject.setting.state = {} as modelMcp.Isetting;
                } else {
                    this.variableObject.setting.state = json.response.data as modelMcp.Isetting;

                    for (let a = 0; a < this.variableObject.setting.state.llmList.length; a++) {
                        if (this.variableObject.setting.state.llmList[a].selected) {
                            this.variableObject.settingLlmServiceId.state = this.variableObject.setting.state.llmList[a].id;

                            break;
                        }
                    }
                }
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiSettingQuery() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;
            });
    };

    apiSettingUpdate = async (setting: modelMcp.Isetting): Promise<void> => {
        const body: modelMcp.IapiSettingUpdateBody = {
            id: setting.id,
            llmList: setting.llmList
        };

        await fetch(`${helperSrc.URL_MCP}/api/setting-update`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "mcp-session-id": session.data.mcpSessionId,
                "mcp-cookie": session.data.mcpCookie
            },
            body: JSON.stringify(body),
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        })
            .then(async (resultApi) => {
                this.variableObject.isOfflineMcp.state = false;

                const json = (await resultApi.json()) as modelHelperSrc.IapiResponse;

                if (json.response.state === "ko") {
                    this.showToastMessage("error", json.response.message);
                } else {
                    this.apiSettingQuery().then(() => {
                        this.showToastMessage("success", json.response.message);
                    });
                }
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiSettingUpdate() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;
            });
    };

    playwrightVideoShow = (fileName: string) => {
        this.apiPlaywrightLogin().then(async () => {
            const blobUrl = await this.apiPlaywrightVideoBlobUrl(fileName);

            this.variableObject.playwrightVideoSrc.state = blobUrl || "";
            this.variableObject.playwrightVideoName.state = fileName;
        });
    };

    playwrightVideoFail = () => {
        this.controllerToast.show("error", ["Content protected, need to be authenticated to view it."]);
    };

    setControllerToast(value: Toast): void {
        this.controllerToast = value;
    }

    constructor() {
        this.variableObject = {} as modelMcp.Ivariable;
        this.methodObject = {} as modelMcp.Imethod;
        this.viewNodeEmpty = { tag: "div", propertyObject: {}, childrenList: [] };

        this.controllerToast = {} as Toast;
    }

    hookObject = {} as modelMcp.IelementHook;

    variable(): void {
        this.variableObject = variableBind(
            {
                adUrl: "",
                loginMode: "",
                isOfflineMcp: false,
                isLogin: false,
                toolList: [],
                toolSelected: {} as modelMcp.Itool,
                taskList: [],
                taskSelected: {} as modelMcp.Itask,
                agentList: [],
                agentSelected: {} as modelMcp.Iagent,
                workspaceItemList: [],
                skillList: [],
                user: {} as modelMcp.Iuser,
                setting: {} as modelMcp.Isetting,
                playwrightVideoSrc: "",
                playwrightVideoName: "",
                isRagRunning: variableLink<boolean>("MenuItem"),
                agentData: variableLink<modelMcp.Iagent>("MenuItem"),
                settingLlmServiceId: variableLink<number>("MenuItem"),
                systemMode: variableLink<string>("Chat"),
                messageList: variableLink<modelChat.IdataMessage[]>("Chat")
            },
            this.constructor.name
        );

        this.methodObject = {
            onClickChipClose: this.onClickChipClose
        };
    }

    variableEffect(watch: IvariableEffect): void {
        watch([]);
    }

    view(name?: string): IvirtualNode {
        if (name === "tool") {
            return viewMcp.tool(this.variableObject, this.methodObject);
        }

        return this.viewNodeEmpty;
    }

    event(): void {}

    subControllerList(): Icontroller[] {
        const resultList: Icontroller[] = [];

        return resultList;
    }

    rendered(): void {}

    destroy(): void {}
}
