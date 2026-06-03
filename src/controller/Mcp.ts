import { Icontroller, IvirtualNode, variableBind, variableLink, IvariableEffect } from "@cimo/jsmvcfw/dist/src/Main.js";
import { open } from "@tauri-apps/plugin-dialog";
import { readFile } from "@tauri-apps/plugin-fs";
import { fetch } from "@tauri-apps/plugin-http";

// Source
import * as session from "../Session";
import * as helperSrc from "../HelperSrc";
import * as modelMcp from "../model/Mcp";
import * as modelIndex from "../model/Index";
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
        const messageList: string[] = [];
        let mode = "success";

        for (const fileStatus of fileStatusList) {
            if (fileStatus.status === "Failed") {
                mode = "error";
            }

            messageList.push(`[${fileStatus.status}] ${fileStatus.fileName}`);
        }

        this.controllerToast.show(mode, messageList, 0);
    };

    private ragEmbeddingStartCheck = (fileStatusList: modelMcp.IfileStatus[], index: number): void => {
        const fileName = fileStatusList[index].fileName;

        let isPolling = false;
        let stdout = "";

        const interval = setInterval(async () => {
            if (isPolling) {
                return;
            }

            isPolling = true;

            await fetch(`${helperSrc.URL_MCP}/api/rag-embedding-check`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "mcp-session-id": session.data.mcpSessionId,
                    "mcp-cookie": session.data.mcpCookie
                },
                body: JSON.stringify({ fileName }),
                danger: {
                    acceptInvalidCerts: true,
                    acceptInvalidHostnames: true
                }
            })
                .then(async (resultApi) => {
                    this.variableObject.isOfflineMcp.state = false;

                    const resultJson = (await resultApi.json()) as modelIndex.IresponseBody;
                    stdout = resultJson.response.stdout;

                    fileStatusList[index].status = stdout;

                    this.showFileStatusMessage(fileStatusList);
                })
                .catch((error: Error) => {
                    helperSrc.writeLog("Mcp.ts - apiRagEmbeddingCheck() - fetch() - catch()", error.message);

                    this.variableObject.isOfflineMcp.state = true;
                });

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

            isPolling = false;
        }, 1000);
    };

    private onClickChipClose = (): void => {
        this.variableObject.toolSelected.state = {} as modelMcp.Itool;
        this.variableObject.taskSelected.state = {} as modelMcp.Itask;
        this.variableObject.agentSelected.state = {} as modelMcp.Iagent;

        this.variableObject.systemMode.state = "chat";
    };

    getVariableObject(): modelMcp.Ivariable {
        return this.variableObject;
    }

    apiLogin = async (): Promise<void> => {
        return fetch(`${helperSrc.URL_MCP}/login`, {
            method: "GET",
            headers: {
                "mcp-session-id": session.data.mcpSessionId
            },
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        })
            .then(async (resultApi) => {
                this.variableObject.isOfflineMcp.state = false;

                const cookie = resultApi.headers.get("set-cookie");

                if (cookie) {
                    const resultJson = (await resultApi.json()) as modelIndex.IresponseBody;
                    const stdout = resultJson.response.stdout;

                    session.writeMcpSession(stdout, cookie);
                }
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiLogin() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;
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

                const resultJson = (await resultApi.json()) as modelIndex.IresponseBody;
                const stdout = JSON.parse(resultJson.response.stdout) as modelMcp.Itool[];

                this.variableObject.toolList.state = stdout;
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

                const resultJson = (await resultApi.json()) as modelIndex.IresponseBody;
                const stdout = JSON.parse(resultJson.response.stdout) as modelMcp.Itask[];

                this.variableObject.taskList.state = stdout;
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

                        const resultJson = (await resultApi.json()) as modelIndex.IresponseBody;
                        const stdout = JSON.parse(resultJson.response.stdout) as modelMcp.IfileStatus;

                        if (stdout.fileName !== "") {
                            const resultFile = stdout;

                            uploadStatusList.push(resultFile);

                            this.apiDocumentList();
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

                const resultJson = (await resultApi.json()) as modelIndex.IresponseBody;
                const stdout = JSON.parse(resultJson.response.stdout) as modelMcp.IfileDetail[];

                this.variableObject.documentList.state = stdout;

                return this.variableObject.documentList.state;
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiDocumentList() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;

                return [];
            });
    };

    apiDocumentRead = async (fileName: string, pageNumber: number): Promise<modelDocument.Iresult> => {
        return fetch(`${helperSrc.URL_MCP}/api/document-read`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "mcp-session-id": session.data.mcpSessionId,
                "mcp-cookie": session.data.mcpCookie
            },
            body: JSON.stringify({ fileName, pageNumber }),
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        })
            .then(async (resultApi) => {
                this.variableObject.isOfflineMcp.state = false;

                const resultJson = (await resultApi.json()) as modelIndex.IresponseBody;
                const stdout = JSON.parse(resultJson.response.stdout) as modelDocument.Iresult;

                return stdout;
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiDocumentRead() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;

                return {} as modelDocument.Iresult;
            });
    };

    apiDocumentDelete = (index: number, fileName: string): void => {
        fetch(`${helperSrc.URL_MCP}/api/document-delete`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "mcp-session-id": session.data.mcpSessionId,
                "mcp-cookie": session.data.mcpCookie
            },
            body: JSON.stringify({ fileName }),
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        })
            .then(() => {
                this.variableObject.isOfflineMcp.state = false;

                const documentFilteredList = [];

                for (let a = 0; a < this.variableObject.documentList.state.length; a++) {
                    if (a !== index) {
                        documentFilteredList.push(this.variableObject.documentList.state[a]);
                    }
                }

                this.variableObject.documentList.state = documentFilteredList;
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiDocumentDelete() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;
            });
    };

    apiRagEmbeddingStart = async (): Promise<void> => {
        this.variableObject.isRagEmbeddingStart.state = true;

        const embeddingStatusList: modelMcp.IfileStatus[] = [];

        await fetch(`${helperSrc.URL_MCP}/api/rag-embedding-start`, {
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

                const resultJson = (await resultApi.json()) as modelIndex.IresponseBody;
                const stdout = JSON.parse(resultJson.response.stdout) as string[];

                if (stdout.length > 0) {
                    for (let a = 0; a < stdout.length; a++) {
                        embeddingStatusList.push({ fileName: stdout[a], status: "Ongoing" });

                        this.showFileStatusMessage(embeddingStatusList);

                        this.ragEmbeddingStartCheck(embeddingStatusList, a);
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

                        const resultJson = (await resultApi.json()) as modelIndex.IresponseBody;
                        const stdout = JSON.parse(resultJson.response.stdout) as modelMcp.IfileStatus;

                        if (stdout.fileName !== "") {
                            uploadStatusList.push(stdout);

                            this.apiSkillList();
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

                const resultJson = (await resultApi.json()) as modelIndex.IresponseBody;
                const stdout = JSON.parse(resultJson.response.stdout) as modelMcp.IfileDetail[];

                this.variableObject.skillList.state = stdout;

                return this.variableObject.skillList.state;
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiSkillList() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;

                return [];
            });
    };

    apiSkillRead = async (fileName: string): Promise<string> => {
        return fetch(`${helperSrc.URL_MCP}/api/skill-read`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "mcp-session-id": session.data.mcpSessionId,
                "mcp-cookie": session.data.mcpCookie
            },
            body: JSON.stringify({ fileName }),
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        })
            .then(async (resultApi) => {
                this.variableObject.isOfflineMcp.state = false;

                const resultJson = (await resultApi.json()) as modelIndex.IresponseBody;
                const stdout = resultJson.response.stdout;

                return stdout;
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiSkillRead() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;

                return "";
            });
    };

    apiSkillDelete = (index: number, fileName: string): void => {
        fetch(`${helperSrc.URL_MCP}/api/skill-delete`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "mcp-session-id": session.data.mcpSessionId,
                "mcp-cookie": session.data.mcpCookie
            },
            body: JSON.stringify({ fileName }),
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        })
            .then(() => {
                this.variableObject.isOfflineMcp.state = false;

                const skillFilteredList = [];

                for (let a = 0; a < this.variableObject.skillList.state.length; a++) {
                    if (a !== index) {
                        skillFilteredList.push(this.variableObject.skillList.state[a]);
                    }
                }

                this.variableObject.skillList.state = skillFilteredList;
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiSkillDelete() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;
            });
    };

    apiAgentCreate = async (agent: modelMcp.Iagent): Promise<void> => {
        this.variableObject.isAgentSave.state = true;

        await fetch(`${helperSrc.URL_MCP}/api/agent-create`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "mcp-session-id": session.data.mcpSessionId,
                "mcp-cookie": session.data.mcpCookie
            },
            body: JSON.stringify({
                name: agent.name,
                description: agent.description,
                skill: agent.skill
            }),
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        })
            .then(async (resultApi) => {
                this.variableObject.isOfflineMcp.state = false;

                const resultJson = (await resultApi.json()) as modelIndex.IresponseBody;
                const stdout = resultJson.response.stdout;

                if (stdout === "ok") {
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

        await fetch(`${helperSrc.URL_MCP}/api/agent-update`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "mcp-session-id": session.data.mcpSessionId,
                "mcp-cookie": session.data.mcpCookie
            },
            body: JSON.stringify({
                id: agent.id,
                name: agent.name,
                description: agent.description,
                skill: agent.skill
            }),
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        })
            .then(async (resultApi) => {
                this.variableObject.isOfflineMcp.state = false;

                const resultJson = (await resultApi.json()) as modelIndex.IresponseBody;
                const stdout = resultJson.response.stdout;

                if (stdout === "ok") {
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

                const resultJson = (await resultApi.json()) as modelIndex.IresponseBody;
                const stdout = JSON.parse(resultJson.response.stdout) as modelMcp.Iagent[];

                this.variableObject.agentList.state = stdout;

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
        fetch(`${helperSrc.URL_MCP}/api/agent-delete`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "mcp-session-id": session.data.mcpSessionId,
                "mcp-cookie": session.data.mcpCookie
            },
            body: JSON.stringify({ id }),
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        })
            .then(async (resultApi) => {
                this.variableObject.isOfflineMcp.state = false;

                const resultJson = (await resultApi.json()) as modelIndex.IresponseBody;
                const stdout = resultJson.response.stdout;

                if (stdout === "ok") {
                    const agentFilteredList = [];

                    for (let a = 0; a < this.variableObject.agentList.state.length; a++) {
                        if (a !== index) {
                            agentFilteredList.push(this.variableObject.agentList.state[a]);
                        }
                    }

                    this.variableObject.agentList.state = agentFilteredList;
                } else {
                    this.controllerToast.show("error", ["Failed to delete agent."]);
                }
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiAgentDelete() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;
            });
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
                systemMode: variableLink<string>("Chat"),
                chatMessageList: variableLink<modelChat.IchatMessage[]>("Chat")
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
        const list: Icontroller[] = [];

        return list;
    }

    rendered(): void {}

    destroy(): void {}
}
