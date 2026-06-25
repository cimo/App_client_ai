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
import * as modelDocument from "../model/Document";
import * as viewMcp from "../view/Mcp";
import type Toast from "./Toast";

export default class Mcp implements Icontroller {
    // Variable
    private variableObject: modelMcp.Ivariable;
    private methodObject: modelMcp.Imethod;
    private viewNodeEmpty: IvirtualNode;
    private controllerToast: Toast;

    // Method
    private showFileStatusMessage = (fileStatusList: modelMcp.IfileStatus[]): void => {
        let mode = "success";

        const messageList: string[] = [];

        for (const fileStatus of fileStatusList) {
            if (fileStatus.status === "Failed") {
                mode = "error";
            }

            messageList.push(`[${fileStatus.status}] ${fileStatus.fileName}`);
        }

        this.controllerToast.show(mode, messageList, 0);
    };

    private apiRagEmbeddingCheck = (fileStatusList: modelMcp.IfileStatus[], index: number): void => {
        const fileName = fileStatusList[index].fileName;

        let isIntervalRunning = false;

        const interval = setInterval(async () => {
            if (isIntervalRunning) {
                return;
            }

            isIntervalRunning = true;

            const body: modelMcp.IapiRagEmbeddingCheckBody = { fileName };

            await fetch(`${helperSrc.URL_MCP}/api/rag-embedding-check`, {
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

                    const json = (await resultApi.json()) as modelHelperSrc.IresponseBody;
                    const stdout = json.response.stdout;

                    fileStatusList[index].status = stdout;

                    this.showFileStatusMessage(fileStatusList);

                    if (stdout !== "Ongoing") {
                        if (interval) {
                            clearInterval(interval);
                        }

                        for (let a = 0; a < fileStatusList.length; a++) {
                            if (fileStatusList[a].status === "Ongoing") {
                                this.variableObject.isRagEmbeddingStart.state = true;

                                break;
                            }

                            if (a === fileStatusList.length - 1) {
                                this.variableObject.isRagEmbeddingStart.state = false;
                            }
                        }
                    }
                })
                .catch((error: Error) => {
                    helperSrc.writeLog("Mcp.ts - apiRagEmbeddingCheck() - fetch() - catch()", error.message);

                    this.variableObject.isOfflineMcp.state = true;
                });

            isIntervalRunning = false;
        }, 1000);
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

    private apiPLaywrightLogin = async (): Promise<void> => {
        return fetch(`${helperSrc.URL_MS_AUTOMATE_TEST}/login`, {
            method: "GET",
            maxRedirections: 0,
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        })
            .then(async (resultApi) => {
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

    apiLogin = async (username: string, password: string): Promise<boolean> => {
        const body: modelMcp.IapiServerLoginBody = {
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
                    const json = (await resultApi.json()) as modelHelperSrc.IresponseBody;
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

                const json = (await resultApi.json()) as modelHelperSrc.IresponseBody;
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

                const json = (await resultApi.json()) as modelHelperSrc.IresponseBody;
                const stdoutList = JSON.parse(json.response.stdout);

                this.variableObject.taskList.state = stdoutList;
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiTask() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;
            });
    };

    apiDocumentUpload = async (): Promise<void> => {
        const pathFileList = await open({
            multiple: true,
            directory: false
        });

        if (pathFileList) {
            this.variableObject.isDocumentUpload.state = true;

            const uploadStatusList: modelMcp.IfileStatus[] = [];

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
                        fileName: encodeURIComponent(fileDetail.fileName)
                    },
                    body: formData,
                    danger: {
                        acceptInvalidCerts: true,
                        acceptInvalidHostnames: true
                    }
                })
                    .then(async (resultApi) => {
                        this.variableObject.isOfflineMcp.state = false;

                        const json = (await resultApi.json()) as modelHelperSrc.IresponseBody;
                        const stdoutObject = JSON.parse(json.response.stdout) as modelMcp.IfileStatus;

                        if (stdoutObject.fileName !== "") {
                            uploadStatusList.push(stdoutObject);
                        } else {
                            uploadStatusList.push({ fileName: fileDetail.fileName, status: "Failed" });
                        }

                        this.showFileStatusMessage(uploadStatusList);
                    })
                    .catch((error: Error) => {
                        helperSrc.writeLog("Mcp.ts - apiDocumentUpload() - fetch() - catch()", error.message);

                        this.variableObject.isOfflineMcp.state = true;
                    });
            }

            this.variableObject.isDocumentUpload.state = false;
        }
    };

    apiDocumentList = async (): Promise<modelMcp.IfileDetail[]> => {
        return fetch(`${helperSrc.URL_MCP}/api/document-list`, {
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

                const json = (await resultApi.json()) as modelHelperSrc.IresponseBody;
                const stdoutList = JSON.parse(json.response.stdout);

                this.variableObject.documentList.state = stdoutList;

                return this.variableObject.documentList.state;
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiDocumentList() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;

                return [];
            });
    };

    apiDocumentRead = async (fileName: string, pageNumber: number): Promise<modelDocument.IdataRead> => {
        const body: modelMcp.IapiDocumentReadBody = { fileName, pageNumber };

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
                this.variableObject.isOfflineMcp.state = false;

                let resultStdoutObject = {} as modelDocument.IdataRead;

                const json = (await resultApi.json()) as modelHelperSrc.IresponseBody;
                const stdout = json.response.stdout;

                if (stdout !== "ko") {
                    resultStdoutObject = JSON.parse(stdout);
                }

                return resultStdoutObject;
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiDocumentRead() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;

                return {} as modelDocument.IdataRead;
            });
    };

    apiDocumentDelete = async (fileName: string): Promise<void> => {
        const body: modelMcp.IapiDocumentDeleteBody = { fileName };

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

                const json = (await resultApi.json()) as modelHelperSrc.IresponseBody;
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

    apiRagEmbeddingStart = async (): Promise<void> => {
        this.variableObject.isRagEmbeddingStart.state = true;

        const fileStatusList: modelMcp.IfileStatus[] = [];

        fetch(`${helperSrc.URL_MCP}/api/rag-embedding-start`, {
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

                const json = (await resultApi.json()) as modelHelperSrc.IresponseBody;
                const stdoutList = JSON.parse(json.response.stdout);

                if (stdoutList.length > 0) {
                    for (let a = 0; a < stdoutList.length; a++) {
                        fileStatusList.push({ fileName: stdoutList[a], status: "Ongoing" });

                        this.showFileStatusMessage(fileStatusList);

                        this.apiRagEmbeddingCheck(fileStatusList, a);
                    }
                } else {
                    this.controllerToast.show("warning", ["No documents found for RAG."]);

                    this.variableObject.isRagEmbeddingStart.state = false;
                }
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiRagEmbeddingStart() - fetch() - catch()", error.message);

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

                const json = (await resultApi.json()) as modelHelperSrc.IresponseBody;
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

            const uploadStatusList: modelMcp.IfileStatus[] = [];

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
                        fileName: encodeURIComponent(fileDetail.fileName)
                    },
                    body: formData,
                    danger: {
                        acceptInvalidCerts: true,
                        acceptInvalidHostnames: true
                    }
                })
                    .then(async (resultApi) => {
                        this.variableObject.isOfflineMcp.state = false;

                        const json = (await resultApi.json()) as modelHelperSrc.IresponseBody;
                        const stdoutObject = JSON.parse(json.response.stdout) as modelMcp.IfileStatus;

                        if (stdoutObject.fileName !== "") {
                            uploadStatusList.push(stdoutObject);
                        } else {
                            uploadStatusList.push({ fileName: fileDetail.fileName, status: "Failed" });
                        }

                        this.showFileStatusMessage(uploadStatusList);
                    })
                    .catch((error: Error) => {
                        helperSrc.writeLog("Mcp.ts - apiSkillUpload() - fetch() - catch()", error.message);

                        this.variableObject.isOfflineMcp.state = true;
                    });
            }

            this.variableObject.isSkillUpload.state = false;
        }
    };

    apiSkillList = async (): Promise<modelMcp.IfileDetail[]> => {
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

                const json = (await resultApi.json()) as modelHelperSrc.IresponseBody;
                const stdoutList = JSON.parse(json.response.stdout);

                this.variableObject.skillList.state = stdoutList;

                return this.variableObject.skillList.state;
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiSkillList() - fetch() - catch()", error.message);

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

                const json = (await resultApi.json()) as modelHelperSrc.IresponseBody;
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

                const json = (await resultApi.json()) as modelHelperSrc.IresponseBody;
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

    apiAgentCreate = async (agent: modelMcp.Iagent): Promise<void> => {
        this.variableObject.isAgentSave.state = true;

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

                const json = (await resultApi.json()) as modelHelperSrc.IresponseBody;
                const stdout = json.response.stdout;

                if (stdout !== "ko") {
                    this.apiAgentList();

                    this.variableObject.agentForm.state = {} as modelMcp.Iagent;
                } else {
                    this.controllerToast.show("error", ["Failed to create agent."]);
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

                const json = (await resultApi.json()) as modelHelperSrc.IresponseBody;
                const stdout = json.response.stdout;

                if (stdout !== "ko") {
                    this.apiAgentList();

                    this.variableObject.agentForm.state = {} as modelMcp.Iagent;
                } else {
                    this.controllerToast.show("error", ["Failed to update agent."]);
                }

                this.variableObject.isAgentSave.state = false;
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiAgentUpdate() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;
            });
    };

    apiAgentList = async (): Promise<modelMcp.Iagent[]> => {
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

                const json = (await resultApi.json()) as modelHelperSrc.IresponseBody;
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
                helperSrc.writeLog("Mcp.ts - apiAgentList() - fetch() - catch()", error.message);

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

                const json = (await resultApi.json()) as modelHelperSrc.IresponseBody;
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

    apiUserInfo = (): void => {
        fetch(`${helperSrc.URL_MCP}/api/user-info`, {
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

                const json = (await resultApi.json()) as modelHelperSrc.IresponseBody;
                const stdout = JSON.parse(json.response.stdout) as modelMcp.Iuser;

                this.variableObject.userInfo.state = stdout;
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiUserInfo() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;
            });
    };

    apiUserUpdate = async (user: modelMcp.Iuser): Promise<void> => {
        this.variableObject.isUserUpdate.state = true;

        const body: modelMcp.IapiUserUpdateBody = {
            id: user.id,
            email: user.email,
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

                const json = (await resultApi.json()) as modelHelperSrc.IresponseBody;
                const stdout = json.response.stdout;

                if (stdout === "ok") {
                    this.apiUserInfo();

                    this.controllerToast.show("success", ["User updated successfully."]);
                } else {
                    this.controllerToast.show("error", ["Failed to update user."]);
                }

                this.variableObject.isUserUpdate.state = false;
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiUserUpdate() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;
            });
    };

    apiSettingInfo = (): void => {
        fetch(`${helperSrc.URL_MCP}/api/setting-info`, {
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

                const json = (await resultApi.json()) as modelHelperSrc.IresponseBody;
                const stdout = JSON.parse(json.response.stdout) as modelMcp.Isetting;

                this.variableObject.settingInfo.state = stdout;
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiSettingInfo() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;
            });
    };

    apiSettingUpdate = async (setting: modelMcp.Isetting): Promise<void> => {
        this.variableObject.isSettingSave.state = true;

        const body: modelMcp.IapiSettingUpdateBody = {
            id: setting.id,
            apiId: setting.apiId
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

                const json = (await resultApi.json()) as modelHelperSrc.IresponseBody;
                const stdout = json.response.stdout;

                if (stdout === "ok") {
                    this.apiSettingInfo();

                    this.controllerToast.show("success", ["Setting updated successfully."]);
                } else {
                    this.controllerToast.show("error", ["Failed to update setting."]);
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

    setControllerToast(controller: Toast): void {
        this.controllerToast = controller;
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
                isDocumentUpload: variableLink<boolean>("MenuItem"),
                isRagEmbeddingStart: variableLink<boolean>("MenuItem"),
                skillList: [],
                isSkillUpload: variableLink<boolean>("MenuItem"),
                agentForm: variableLink<modelMcp.Iagent>("MenuItem"),
                isAgentSave: variableLink<boolean>("MenuItem"),
                userInfo: {} as modelMcp.Iuser,
                isUserUpdate: variableLink<boolean>("MenuItem"),
                settingInfo: {} as modelMcp.Isetting,
                isSettingSave: variableLink<boolean>("MenuItem"),
                systemMode: variableLink<string>("Chat"),
                chatMessageList: variableLink<modelChat.IdataMessage[]>("Chat"),
                playwrightVideoSrc: "",
                playwrightVideoName: ""
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
