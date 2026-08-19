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
    private showToastMessage = (mode: string, message: string | string[]): void => {
        let messageList: string[] = [];

        if (typeof message !== "string") {
            messageList = message;
        } else {
            messageList = [message];
        }

        this.controllerToast.show(mode, messageList);
    };

    private showFileFailedMessage = async (actionOperationList: modelMcp.IactionOperation[]): Promise<void> => {
        const messageList: string[] = [];

        for (const actionOperation of actionOperationList) {
            if ((actionOperation.state === "ko" || actionOperation.state === "failed") && actionOperation.data) {
                const fileDetail = await helperSrc.fileDetail(actionOperation.data as string);

                messageList.push(`[Failed] ${fileDetail.name}`);
            }
        }

        this.controllerToast.show("error", messageList, 0);
    };

    private apiRagCheck = (actionOperationList: modelMcp.IactionOperation[], index: number): void => {
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
                        const stdoutObject = JSON.parse(json.response.stdout) as modelMcp.IactionOperation;

                        actionOperationList[index].state = stdoutObject.state;

                        if (stdoutObject.state !== "ongoing") {
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

    apiLogin = async (username: string, password: string): Promise<boolean> => {
        const body: modelMcp.IapiLoginBody = {
            username,
            password
        };

        return fetch(`${helperSrc.URL_MCP}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "mcp-session-id": session.data.mcpSessionId
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
                    const stdoutObject = JSON.parse(json.response.stdout) as modelMcp.IactionOperation;

                    if (stdoutObject.state === "ko" || !stdoutObject.data) {
                        this.showToastMessage("error", stdoutObject.message);
                    } else {
                        this.variableObject.isLogin.state = true;

                        session.writeMcpSession(stdoutObject.data as string, cookie);

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

    apiLogout = async (): Promise<void | Response> => {
        return fetch(`${helperSrc.URL_MCP}/logout`, {
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
            .then(() => {
                this.variableObject.isOfflineMcp.state = false;

                session.deleteMcpSession();
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiLogout() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;
            });
    };

    apiTool = async (): Promise<void> => {
        return fetch(`${helperSrc.URL_MCP}/api/tool-list`, {
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
                const stdoutObject = JSON.parse(json.response.stdout) as modelMcp.IactionOperation;

                if (stdoutObject.state === "ok" && stdoutObject.data) {
                    this.variableObject.toolList.state = stdoutObject.data as modelMcp.Itool[];
                }
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiTool() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;
            });
    };

    apiTask = async (): Promise<void> => {
        return fetch(`${helperSrc.URL_MCP}/api/task-list`, {
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
                const stdoutObject = JSON.parse(json.response.stdout) as modelMcp.IactionOperation;

                if (stdoutObject.state === "ok" && stdoutObject.data) {
                    this.variableObject.taskList.state = stdoutObject.data as modelMcp.Itask[];
                }
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiTask() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;
            });
    };

    apiDocumentUpload = async (currentFolderList: string[]): Promise<void> => {
        const pathFileList = await open({
            multiple: true,
            directory: false
        });

        if (pathFileList) {
            this.variableObject.isUploadRunning.state = true;

            const actionOperationList: modelMcp.IactionOperation[] = [];

            for (let a = 0; a < pathFileList.length; a++) {
                const pathFile = pathFileList[a];

                const file = await readFile(pathFile);
                const fileDetail = await helperSrc.fileDetail(pathFile, file);

                const blob = new Blob([file], { type: fileDetail.mimeType });

                const formData = new FormData();
                formData.append("file", blob, encodeURIComponent(fileDetail.name));

                await fetch(`${helperSrc.URL_MCP}/api/document-upload`, {
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

                        actionOperationList.push(JSON.parse(json.response.stdout) as modelMcp.IactionOperation);

                        await this.showFileFailedMessage(actionOperationList);
                    })
                    .catch((error: Error) => {
                        helperSrc.writeLog("Mcp.ts - apiDocumentUpload() - fetch() - catch()", error.message);

                        this.variableObject.isOfflineMcp.state = true;
                    });
            }

            this.variableObject.isUploadRunning.state = false;
        }
    };

    apiDocumentSelect = async (currentFolderList: string[]): Promise<modelMcp.IitemDetail[]> => {
        const body: modelMcp.IapiDocumentListBody = { folderJoin: currentFolderList.join("/") };

        return fetch(`${helperSrc.URL_MCP}/api/document-list`, {
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
                const stdoutObject = JSON.parse(json.response.stdout) as modelMcp.IactionOperation;

                if (stdoutObject.state === "ok" && stdoutObject.data) {
                    this.variableObject.documentList.state = stdoutObject.data as modelMcp.IitemDetail[];
                }

                return this.variableObject.documentList.state;
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiDocumentSelect() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;

                return [];
            });
    };

    apiDocumentRead = async (fileName: string): Promise<string> => {
        const body: modelMcp.IapiDocumentReadBody = { fileName };

        return fetch(`${helperSrc.URL_MCP}/api/document-read`, {
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
                const stdoutObject = JSON.parse(json.response.stdout) as modelMcp.IactionOperation;

                if (stdoutObject.state === "ok" && stdoutObject.data) {
                    result = stdoutObject.data as string;
                }

                return result;
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiDocumentRead() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;

                return "";
            });
    };

    apiDocumentDelete = async (pathItem: string): Promise<boolean> => {
        const body: modelMcp.IapiDocumentDeleteBody = { pathItem };

        return fetch(`${helperSrc.URL_MCP}/api/document-delete`, {
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
            .then(() => {
                this.variableObject.isOfflineMcp.state = false;

                return true;
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiDocumentDelete() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;

                return false;
            });
    };

    apiDocumentRename = async (pathItem: string, name: string): Promise<boolean> => {
        const body: modelMcp.IapiDocumentRenameBody = { pathItem, name };

        return fetch(`${helperSrc.URL_MCP}/api/document-rename`, {
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
                const stdoutObject = JSON.parse(json.response.stdout) as modelMcp.IactionOperation;

                if (stdoutObject.state === "ko") {
                    this.showToastMessage("error", stdoutObject.message);

                    isResult = false;
                } else {
                    isResult = true;
                }

                return isResult;
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiDocumentRename() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;

                return false;
            });
    };

    apiDocumentFolderCreate = async (folderName: string, currentFolderList: string[]): Promise<boolean> => {
        this.variableObject.isDocumentFolderCreateRunning.state = true;

        const body: modelMcp.IapiDocumentFolderCreateBody = { folderName, folderJoin: currentFolderList.join("/") };

        return fetch(`${helperSrc.URL_MCP}/api/document-folder-create`, {
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
                const stdoutObject = JSON.parse(json.response.stdout) as modelMcp.IactionOperation;

                if (stdoutObject.state === "ko") {
                    this.showToastMessage("error", stdoutObject.message);

                    isResult = false;
                } else {
                    isResult = true;
                }

                this.variableObject.isDocumentFolderCreateRunning.state = false;

                return isResult;
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiDocumentFolderCreate() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;

                this.variableObject.isDocumentFolderCreateRunning.state = false;

                return false;
            });
    };

    apiDocumentFolderMove = async (selectList: string[], currentFolderList: string[]): Promise<boolean> => {
        this.variableObject.isDocumentFolderMoveRunning.state = true;

        const body: modelMcp.IapiDocumentFolderMoveBody = { pathList: selectList, folderJoin: currentFolderList.join("/") };

        return fetch(`${helperSrc.URL_MCP}/api/document-folder-move`, {
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
                const stdoutObject = JSON.parse(json.response.stdout) as modelMcp.IactionOperation;

                if (stdoutObject.state === "ko") {
                    this.showToastMessage("error", stdoutObject.message);

                    isResult = false;
                } else {
                    isResult = true;
                }

                this.variableObject.isDocumentFolderMoveRunning.state = false;

                return isResult;
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiDocumentFolderMove() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;

                this.variableObject.isDocumentFolderMoveRunning.state = false;

                return false;
            });
    };

    apiRagStart = (): void => {
        this.variableObject.isRagRunning.state = true;

        const actionOperationList: modelMcp.IactionOperation[] = [];

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
                const stdoutObject = JSON.parse(json.response.stdout) as modelMcp.IactionOperation;

                if (stdoutObject.state === "ko" || !stdoutObject.data) {
                    this.showToastMessage("error", stdoutObject.message);

                    this.variableObject.isRagRunning.state = false;
                } else {
                    const pathFileList = stdoutObject.data as string[];

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
                const stdoutObject = JSON.parse(json.response.stdout) as modelMcp.IactionOperation;

                if (stdoutObject.state === "ok" && stdoutObject.data) {
                    result = stdoutObject.data as string;
                }

                return result;
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiRagGraph() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;

                return "";
            });
    };

    apiSkillUpload = async (): Promise<void> => {
        const pathFileList = await open({
            multiple: true,
            directory: false
        });

        if (pathFileList) {
            this.variableObject.isUploadRunning.state = true;

            const actionOperationList: modelMcp.IactionOperation[] = [];

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

                        actionOperationList.push(JSON.parse(json.response.stdout) as modelMcp.IactionOperation);

                        await this.showFileFailedMessage(actionOperationList);
                    })
                    .catch((error: Error) => {
                        helperSrc.writeLog("Mcp.ts - apiSkillUpload() - fetch() - catch()", error.message);

                        this.variableObject.isOfflineMcp.state = true;
                    });
            }

            this.variableObject.isUploadRunning.state = false;
        }
    };

    apiSkillSelect = async (): Promise<modelMcp.IitemDetail[]> => {
        return fetch(`${helperSrc.URL_MCP}/api/skill-list`, {
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
                const stdoutObject = JSON.parse(json.response.stdout) as modelMcp.IactionOperation;

                if (stdoutObject.state === "ok" && stdoutObject.data) {
                    this.variableObject.skillList.state = stdoutObject.data as modelMcp.IitemDetail[];
                }

                return this.variableObject.skillList.state;
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiSkillSelect() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;

                return [];
            });
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
                const stdoutObject = JSON.parse(json.response.stdout) as modelMcp.IactionOperation;

                if (stdoutObject.state === "ok" && stdoutObject.data) {
                    result = stdoutObject.data as string;
                }

                return result;
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiSkillRead() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;

                return "";
            });
    };

    apiSkillDelete = async (fileName: string): Promise<boolean> => {
        const body: modelMcp.IapiSkillDeleteBody = { fileName };

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
            .then(() => {
                this.variableObject.isOfflineMcp.state = false;

                return true;
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiSkillDelete() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;

                return false;
            });
    };

    apiAgentCreate = (agent: modelMcp.Iagent): void => {
        this.variableObject.isAgentSave.state = true;

        const body: modelMcp.IapiAgentCreateBody = {
            name: agent.name,
            description: agent.description,
            skillName: agent.skillName
        };

        fetch(`${helperSrc.URL_MCP}/api/agent-create`, {
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
                const stdoutObject = JSON.parse(json.response.stdout) as modelMcp.IactionOperation;

                if (stdoutObject.state === "ko") {
                    this.showToastMessage("error", stdoutObject.message);
                } else {
                    await this.apiAgentSelect();

                    this.variableObject.agentData.state = {} as modelMcp.Iagent;

                    this.showToastMessage("success", stdoutObject.message);
                }

                this.variableObject.isAgentSave.state = false;
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiAgentCreate() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;
            });
    };

    apiAgentUpdate = async (agent: modelMcp.Iagent): Promise<void> => {
        this.variableObject.isAgentSave.state = true;

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
                const stdoutObject = JSON.parse(json.response.stdout) as modelMcp.IactionOperation;

                if (stdoutObject.state === "ko") {
                    this.showToastMessage("error", stdoutObject.message);
                } else {
                    await this.apiAgentSelect();

                    this.variableObject.agentData.state = {} as modelMcp.Iagent;

                    this.showToastMessage("success", stdoutObject.message);
                }

                this.variableObject.isAgentSave.state = false;
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiAgentUpdate() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;
            });
    };

    apiAgentSelect = async (): Promise<modelMcp.Iagent[]> => {
        return fetch(`${helperSrc.URL_MCP}/api/agent-list`, {
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
                const stdoutObject = JSON.parse(json.response.stdout) as modelMcp.IactionOperation;

                if (stdoutObject.state === "ok" && stdoutObject.data) {
                    this.variableObject.agentList.state = stdoutObject.data as modelMcp.Iagent[];
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
                helperSrc.writeLog("Mcp.ts - apiAgentSelect() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;

                return [];
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
                const stdout = json.response.stdout;

                if (stdout === "ok") {
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

    apiUserSelect = async (): Promise<void> => {
        return fetch(`${helperSrc.URL_MCP}/api/user-read`, {
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
                const stdoutObject = JSON.parse(json.response.stdout) as modelMcp.IactionOperation;

                if (stdoutObject.state === "ok" && stdoutObject.data) {
                    this.variableObject.user.state = stdoutObject.data as modelMcp.Iuser;
                }
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiUserSelect() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;
            });
    };

    apiUserUpdate = (user: modelMcp.Iuser): void => {
        this.variableObject.isUserUpdate.state = true;

        const body: modelMcp.IapiUserUpdateBody = {
            id: user.id,
            name: user.name,
            surname: user.surname,
            password: user.password || ""
        };

        fetch(`${helperSrc.URL_MCP}/api/user-update`, {
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
                const stdoutObject = JSON.parse(json.response.stdout) as modelMcp.IactionOperation;

                if (stdoutObject.state === "ko") {
                    this.showToastMessage("error", stdoutObject.message);
                } else {
                    this.apiUserSelect();

                    this.showToastMessage("success", stdoutObject.message);
                }

                this.variableObject.isUserUpdate.state = false;
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiUserUpdate() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;
            });
    };

    apiSettingSelect = async (): Promise<void> => {
        return fetch(`${helperSrc.URL_MCP}/api/setting-read`, {
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
                const stdoutObject = JSON.parse(json.response.stdout) as modelMcp.IactionOperation;

                if (stdoutObject.state === "ok" && stdoutObject.data) {
                    this.variableObject.setting.state = stdoutObject.data as modelMcp.Isetting;

                    for (let a = 0; a < this.variableObject.setting.state.llm.length; a++) {
                        if (this.variableObject.setting.state.llm[a].selected) {
                            this.variableObject.settingLlmServiceId.state = this.variableObject.setting.state.llm[a].id;

                            break;
                        }
                    }
                }
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiSettingSelect() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;
            });
    };

    apiSettingUpdate = (setting: modelMcp.Isetting): void => {
        this.variableObject.isSettingSave.state = true;

        const body: modelMcp.IapiSettingUpdateBody = {
            id: setting.id,
            llm: setting.llm
        };

        fetch(`${helperSrc.URL_MCP}/api/setting-update`, {
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
                const stdoutObject = JSON.parse(json.response.stdout) as modelMcp.IactionOperation;

                if (stdoutObject.state === "ko") {
                    this.showToastMessage("error", stdoutObject.message);
                } else {
                    this.apiSettingSelect();

                    this.showToastMessage("success", stdoutObject.message);
                }

                this.variableObject.isSettingSave.state = false;
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
                isOfflineMcp: false,
                isLogin: false,
                toolList: [],
                toolSelected: {} as modelMcp.Itool,
                taskList: [],
                taskSelected: {} as modelMcp.Itask,
                agentList: [],
                agentSelected: {} as modelMcp.Iagent,
                documentList: [],
                skillList: [],
                user: {} as modelMcp.Iuser,
                setting: {} as modelMcp.Isetting,
                playwrightVideoSrc: "",
                playwrightVideoName: "",
                isUploadRunning: variableLink<boolean>("MenuItem"),
                isDocumentFolderMoveRunning: variableLink<boolean>("MenuItem"),
                isDocumentFolderCreateRunning: variableLink<boolean>("MenuItem"),
                isRagRunning: variableLink<boolean>("MenuItem"),
                agentData: variableLink<modelMcp.Iagent>("MenuItem"),
                isAgentSave: variableLink<boolean>("MenuItem"),
                isUserUpdate: variableLink<boolean>("MenuItem"),
                settingLlmServiceId: variableLink<number>("MenuItem"),
                isSettingSave: variableLink<boolean>("MenuItem"),
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
