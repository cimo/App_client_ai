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
    private showFileStatusMessage = (actionOperationList: modelMcp.IactionOperation[]): void => {
        const messageList: string[] = [];

        for (const actionOperation of actionOperationList) {
            if (
                ((actionOperation.isComplete !== undefined && !actionOperation.isComplete) ||
                    (actionOperation.state !== undefined && actionOperation.state === "failed")) &&
                actionOperation.pathFile
            ) {
                const fileDetail = helperSrc.fileDetail(actionOperation.pathFile);

                messageList.push(`[${actionOperation.message}] ${fileDetail.fileName}`);
            }
        }

        this.controllerToast.show("error", messageList, 0);
    };

    private apiRagCheck = (actionOperationList: modelMcp.IactionOperation[], index: number): void => {
        const pathFile = actionOperationList[index].pathFile;

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
                        const stdout = json.response.stdout;

                        actionOperationList[index].state = stdout;

                        if (stdout !== "ongoing") {
                            if (interval) {
                                clearInterval(interval);
                            }

                            for (let a = 0; a < actionOperationList.length; a++) {
                                if (actionOperationList[a].state === "ongoing") {
                                    this.variableObject.isRagStart.state = true;

                                    break;
                                }

                                if (a === actionOperationList.length - 1) {
                                    this.variableObject.isRagStart.state = false;
                                }
                            }
                        }

                        this.showFileStatusMessage(actionOperationList);
                    })
                    .catch((error: Error) => {
                        helperSrc.writeLog("Mcp.ts - apiRagCheck() - fetch() - catch()", error.message);

                        this.variableObject.isOfflineMcp.state = true;
                    });
            }

            isIntervalRunning = false;
        }, 1000);
    };

    private apiPLaywrightLogin = async (): Promise<void> => {
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
                helperSrc.writeLog("Mcp.ts - apiPLaywrightLogin() - catch()", error);
            });
    };

    private apiPLaywrightVideoBlobUrl = async (fileName: string): Promise<string | void> => {
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
                helperSrc.writeLog("Mcp.ts - apiPLaywrightVideoBlobUrl() - catch()", error);
            });
    };

    private apiPLaywrightLogout = async (): Promise<void> => {
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
                helperSrc.writeLog("Mcp.ts - apiPLaywrightLogout() - fetch() - catch()", error);
            });
    };

    private onClickChipClose = (): void => {
        this.variableObject.toolSelected.state = {} as modelMcp.Itool;
        this.variableObject.taskSelected.state = {} as modelMcp.Itask;
        this.variableObject.agentSelected.state = {} as modelMcp.Iagent;

        if (session.data.msAutomateTestCookie) {
            this.apiPLaywrightLogout().then(() => {
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
                let result = false;

                this.variableObject.isOfflineMcp.state = false;

                const cookie = resultApi.headers.get("set-cookie");

                if (cookie) {
                    const json = (await resultApi.json()) as modelHelperSrc.IapiResponse;
                    const stdoutObject = JSON.parse(json.response.stdout) as modelMcp.IuserLoginSession;

                    if (stdoutObject.mcpSessionId !== "") {
                        this.variableObject.isLogin.state = true;

                        session.writeMcpSession(stdoutObject.mcpSessionId, cookie);

                        result = true;
                    } else if (stdoutObject.mcpSessionId === "" && stdoutObject.message !== "") {
                        this.controllerToast.show("error", [stdoutObject.message]);
                    }
                }

                return result;
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
                const stdoutList = JSON.parse(json.response.stdout);

                this.variableObject.toolList.state = stdoutList;
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
                const stdoutList = JSON.parse(json.response.stdout);

                this.variableObject.taskList.state = stdoutList;
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiTask() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;
            });
    };

    apiDocumentUpload = async (documentCurrentFolderList: string[]): Promise<void> => {
        const pathFileList = await open({
            multiple: true,
            directory: false
        });

        if (pathFileList) {
            this.variableObject.isDocumentUpload.state = true;

            const actionOperationList: modelMcp.IactionOperation[] = [];

            for (let a = 0; a < pathFileList.length; a++) {
                const pathFile = pathFileList[a];

                const file = await readFile(pathFile);
                const fileDetail = helperSrc.fileDetail(pathFile, file);

                const blob = new Blob([file], { type: fileDetail.mimeType });

                const formData = new FormData();
                formData.append("file", blob, encodeURIComponent(fileDetail.fileName));

                await fetch(`${helperSrc.URL_MCP}/api/document-upload`, {
                    method: "POST",
                    headers: {
                        "mcp-session-id": session.data.mcpSessionId,
                        "mcp-cookie": session.data.mcpCookie,
                        fileNameEncode: encodeURIComponent(fileDetail.fileName),
                        folderJoin: documentCurrentFolderList.join("/")
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
                        const stdoutObject = JSON.parse(json.response.stdout) as modelMcp.IactionOperation;

                        if (!stdoutObject.isComplete) {
                            actionOperationList.push(stdoutObject);
                        }

                        this.showFileStatusMessage(actionOperationList);
                    })
                    .catch((error: Error) => {
                        helperSrc.writeLog("Mcp.ts - apiDocumentUpload() - fetch() - catch()", error.message);

                        this.variableObject.isOfflineMcp.state = true;
                    });
            }

            this.variableObject.isDocumentUpload.state = false;
        }
    };

    apiDocumentSelect = async (documentCurrentFolderList: string[]): Promise<modelMcp.IfileDetail[]> => {
        const body: modelMcp.IapiDocumentListBody = { folderJoin: documentCurrentFolderList.join("/") };

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
                const stdoutList = JSON.parse(json.response.stdout);

                this.variableObject.documentList.state = stdoutList;

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
                const stdout = json.response.stdout;

                if (stdout !== "ko") {
                    result = stdout;
                }

                return result;
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiDocumentRead() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;

                return "";
            });
    };

    apiDocumentDelete = async (pathFile: string): Promise<void> => {
        const body: modelMcp.IapiDocumentDeleteBody = { pathFile };

        await fetch(`${helperSrc.URL_MCP}/api/document-delete`, {
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
                const stdout = json.response.stdout;

                if (stdout === "ko") {
                    this.controllerToast.show("error", ["Failed to delete document."]);
                }
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiDocumentDelete() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;
            });
    };

    apiDocumentFolderCreate = async (folderName: string, documentCurrentFolderList: string[]): Promise<boolean> => {
        const body: modelMcp.IapiDocumentFolderCreateBody = { folderName, folderJoin: documentCurrentFolderList.join("/") };

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
                this.variableObject.isOfflineMcp.state = false;

                const json = (await resultApi.json()) as modelHelperSrc.IapiResponse;
                const stdoutObject = JSON.parse(json.response.stdout) as modelMcp.IactionOperation;

                if (stdoutObject.isComplete) {
                    this.controllerToast.show("success", [stdoutObject.message]);

                    return true;
                } else {
                    this.controllerToast.show("error", [stdoutObject.message]);

                    return false;
                }
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiDocumentFolderCreate() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;

                return false;
            });
    };

    apiRagStart = (): void => {
        this.variableObject.isRagStart.state = true;

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
                const stdoutList = JSON.parse(json.response.stdout);

                if (stdoutList.length > 0) {
                    for (let a = 0; a < stdoutList.length; a++) {
                        actionOperationList.push({ message: "", state: "ongoing", pathFile: stdoutList[a] });

                        this.apiRagCheck(actionOperationList, a);
                    }
                } else {
                    this.controllerToast.show("warning", ["No documents found for RAG."]);

                    this.variableObject.isRagStart.state = false;
                }
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiRagStart() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;
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
                this.variableObject.isOfflineMcp.state = false;

                const json = (await resultApi.json()) as modelHelperSrc.IapiResponse;
                const stdout = json.response.stdout;

                return stdout;
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
            this.variableObject.isSkillUpload.state = true;

            const actionOperationList: modelMcp.IactionOperation[] = [];

            for (let a = 0; a < pathFileList.length; a++) {
                const pathFile = pathFileList[a];

                const file = await readFile(pathFile);
                const fileDetail = helperSrc.fileDetail(pathFile, file);
                const blob = new Blob([file], { type: fileDetail.mimeType });

                const formData = new FormData();
                formData.append("file", blob, encodeURIComponent(fileDetail.fileName));

                await fetch(`${helperSrc.URL_MCP}/api/skill-upload`, {
                    method: "POST",
                    headers: {
                        "mcp-session-id": session.data.mcpSessionId,
                        "mcp-cookie": session.data.mcpCookie,
                        fileNameEncode: encodeURIComponent(fileDetail.fileName)
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
                        const stdoutObject = JSON.parse(json.response.stdout) as modelMcp.IactionOperation;

                        if (!stdoutObject.isComplete) {
                            actionOperationList.push(stdoutObject);
                        }

                        this.showFileStatusMessage(actionOperationList);
                    })
                    .catch((error: Error) => {
                        helperSrc.writeLog("Mcp.ts - apiSkillUpload() - fetch() - catch()", error.message);

                        this.variableObject.isOfflineMcp.state = true;
                    });
            }

            this.variableObject.isSkillUpload.state = false;
        }
    };

    apiSkillSelect = async (): Promise<modelMcp.IfileDetail[]> => {
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
                const stdoutList = JSON.parse(json.response.stdout);

                this.variableObject.skillList.state = stdoutList;

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
                const stdout = json.response.stdout;

                if (stdout !== "ko") {
                    result = stdout;
                }

                return result;
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiSkillRead() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;

                return "";
            });
    };

    apiSkillDelete = async (fileName: string): Promise<void> => {
        const body: modelMcp.IapiSkillDeleteBody = { fileName };

        await fetch(`${helperSrc.URL_MCP}/api/skill-delete`, {
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
                const stdout = json.response.stdout;

                if (stdout === "ko") {
                    this.controllerToast.show("error", ["Failed to delete skill."]);
                }
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiSkillDelete() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;
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

                if (stdoutObject.isComplete) {
                    this.apiAgentSelect();

                    this.variableObject.agentForm.state = {} as modelMcp.Iagent;

                    this.controllerToast.show("success", [stdoutObject.message]);
                } else {
                    this.controllerToast.show("error", [stdoutObject.message]);
                }

                this.variableObject.isAgentSave.state = false;
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiAgentCreate() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;
            });
    };

    apiAgentUpdate = (agent: modelMcp.Iagent): void => {
        this.variableObject.isAgentSave.state = true;

        const body: modelMcp.IapiAgentUpdateBody = {
            id: agent.id,
            name: agent.name,
            description: agent.description,
            skillName: agent.skillName
        };

        fetch(`${helperSrc.URL_MCP}/api/agent-update`, {
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

                if (stdoutObject.isComplete) {
                    this.apiAgentSelect();

                    this.variableObject.agentForm.state = {} as modelMcp.Iagent;

                    this.controllerToast.show("success", [stdoutObject.message]);
                } else {
                    this.controllerToast.show("error", [stdoutObject.message]);
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
                const stdoutList = JSON.parse(json.response.stdout);

                this.variableObject.agentList.state = stdoutList;

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

    apiAgentDelete = (index: number, id: number): void => {
        const body: modelMcp.IapiAgentDeleteBody = { id };

        fetch(`${helperSrc.URL_MCP}/api/agent-delete`, {
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
                const stdout = json.response.stdout;

                if (stdout !== "ko") {
                    const filteredList = [];

                    for (let a = 0; a < this.variableObject.agentList.state.length; a++) {
                        if (a !== index) {
                            filteredList.push(this.variableObject.agentList.state[a]);
                        }
                    }

                    this.variableObject.agentList.state = filteredList;
                } else {
                    this.controllerToast.show("error", ["Failed to delete agent."]);
                }
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiAgentDelete() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;
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
                const stdout = JSON.parse(json.response.stdout) as modelMcp.Iuser;

                this.variableObject.user.state = stdout;
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

                if (stdoutObject.isComplete) {
                    this.apiUserSelect();

                    this.controllerToast.show("success", [stdoutObject.message]);
                } else {
                    this.controllerToast.show("error", [stdoutObject.message]);
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
                const stdout = JSON.parse(json.response.stdout) as modelMcp.Isetting;

                this.variableObject.setting.state = stdout;

                for (let a = 0; a < this.variableObject.setting.state.llm.length; a++) {
                    if (this.variableObject.setting.state.llm[a].selected) {
                        this.variableObject.settingLlmServiceId.state = this.variableObject.setting.state.llm[a].id;

                        break;
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

                if (stdoutObject.isComplete) {
                    this.apiSettingSelect();

                    this.controllerToast.show("success", [stdoutObject.message]);
                } else {
                    this.controllerToast.show("error", [stdoutObject.message]);
                }

                this.variableObject.isSettingSave.state = false;
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiSettingUpdate() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;
            });
    };

    playwrightVideoShow = (fileName: string) => {
        this.apiPLaywrightLogin().then(async () => {
            const blobUrl = await this.apiPLaywrightVideoBlobUrl(fileName);

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
                isDocumentUpload: variableLink<boolean>("MenuItem"),
                isRagStart: variableLink<boolean>("MenuItem"),
                isSkillUpload: variableLink<boolean>("MenuItem"),
                agentForm: variableLink<modelMcp.Iagent>("MenuItem"),
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
