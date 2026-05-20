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

export default class Mcp implements Icontroller {
    // Variable
    private variableObject: modelMcp.Ivariable;
    private methodObject: modelMcp.Imethod;
    private viewNodeEmpty: IvirtualNode;

    // Method
    private apiEmbeddingCheck = async (fileName: string): Promise<string> => {
        return fetch(`${helperSrc.URL_MCP}/api/embedding-check`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "mcp-session-id": session.data.mcpSessionId,
                Cookie: session.data.mcpCookie
            },
            body: JSON.stringify({ fileName }),
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        })
            .then(async (result) => {
                this.variableObject.isOfflineMcp.state = false;

                const resultJson = (await result.json()) as modelIndex.IresponseBody;

                return resultJson.response.stdout;
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiEmbeddingCheck() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;

                return "fail";
            });
    };

    private startEmbeddingCheck = (embeddingListIndex: number): void => {
        const fileName = this.variableObject.documentEmbeddingStatusList.state[embeddingListIndex].fileName;

        let isPolling = false;
        let embeddingStatus = "ongoing";

        const interval = setInterval(async () => {
            if (isPolling) {
                return;
            }

            isPolling = true;

            embeddingStatus = await this.apiEmbeddingCheck(fileName);

            if (embeddingStatus !== "ongoing") {
                if (embeddingListIndex !== -1) {
                    const embeddingListState = this.variableObject.documentEmbeddingStatusList.state.slice();

                    if (embeddingStatus === "done") {
                        embeddingListState[embeddingListIndex] = {
                            ...embeddingListState[embeddingListIndex],
                            status: "Success"
                        };
                    } else if (embeddingStatus === "fail") {
                        embeddingListState[embeddingListIndex] = {
                            ...embeddingListState[embeddingListIndex],
                            status: "Failed"
                        };
                    }

                    this.variableObject.documentEmbeddingStatusList.state = embeddingListState;
                }

                if (interval) {
                    clearInterval(interval);
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
            .then(async (result) => {
                this.variableObject.isOfflineMcp.state = false;

                const cookie = result.headers.get("set-cookie") || "";

                const resultJson = (await result.json()) as modelIndex.IresponseBody;

                session.writeMcpSession(resultJson.response.stdout, cookie);
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiLogin() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;
            });
    };

    apiTool = async (): Promise<void> => {
        return fetch(`${helperSrc.URL_MCP}/api/tool-list`, {
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
            .then(async (result) => {
                this.variableObject.isOfflineMcp.state = false;

                const resultJson = (await result.json()) as modelIndex.IresponseBody;

                if (resultJson.response.stdout !== "") {
                    this.variableObject.toolList.state = JSON.parse(resultJson.response.stdout) as modelMcp.Itool[];
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
                Cookie: session.data.mcpCookie
            },
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        })
            .then(async (result) => {
                this.variableObject.isOfflineMcp.state = false;

                const resultJson = (await result.json()) as modelIndex.IresponseBody;

                if (resultJson.response.stdout !== "") {
                    this.variableObject.taskList.state = JSON.parse(resultJson.response.stdout) as modelMcp.Itask[];
                }
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiTask() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;
            });
    };

    apiLogout = async (): Promise<void | Response> => {
        return fetch(`${helperSrc.URL_MCP}/logout`, {
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
            .then(() => {
                this.variableObject.isOfflineMcp.state = false;

                session.deleteMcpSession();
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiLogout() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;
            });
    };

    apiDocumentUpload = async (): Promise<void> => {
        const pathFileList = await open({
            multiple: true,
            directory: false
        });

        if (pathFileList) {
            this.variableObject.isDocumentUploading.state = true;
            this.variableObject.documentUploadStatusList.state = [];
            this.variableObject.documentEmbeddingStatusList.state = [];

            for (const pathFile of pathFileList) {
                const file = await readFile(pathFile);
                const mimeType = helperSrc.readMimeType(file);
                const blob = new Blob([file], { type: mimeType.content });
                const fileName = pathFile.split(/[/\\]/).pop() || "file";

                const formData = new FormData();
                formData.append("file", blob, `${fileName}`);

                await fetch(`${helperSrc.URL_MCP}/api/document-upload`, {
                    method: "POST",
                    headers: {
                        "mcp-session-id": session.data.mcpSessionId,
                        Cookie: session.data.mcpCookie,
                        fileName
                    },
                    body: formData,
                    danger: {
                        acceptInvalidCerts: true,
                        acceptInvalidHostnames: true
                    }
                })
                    .then(async (result) => {
                        this.variableObject.isOfflineMcp.state = false;

                        const resultJson = (await result.json()) as modelIndex.IresponseBody;

                        if (resultJson.response.stdout !== "") {
                            this.variableObject.isDocumentUploading.state = false;

                            const resultFile = JSON.parse(resultJson.response.stdout) as modelMcp.IfileStatus;

                            this.variableObject.documentUploadStatusList.state.push(resultFile);

                            this.apiDocumentList();

                            if (helperSrc.filterMimeType(resultFile.fileName) !== "image" && resultFile.status === "Success") {
                                this.variableObject.documentEmbeddingStatusList.state.push({ fileName: resultFile.fileName, status: "Ongoing" });

                                this.startEmbeddingCheck(this.variableObject.documentEmbeddingStatusList.state.length - 1);
                            }
                        }
                    })
                    .catch((error: Error) => {
                        helperSrc.writeLog("Mcp.ts - apiDocumentUpload() - fetch() - catch()", error.message);

                        this.variableObject.isOfflineMcp.state = true;
                    });
            }
        }
    };

    apiDocumentList = async (): Promise<void> => {
        fetch(`${helperSrc.URL_MCP}/api/document-list`, {
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
            .then(async (result) => {
                this.variableObject.isOfflineMcp.state = false;

                const resultJson = (await result.json()) as modelIndex.IresponseBody;

                if (resultJson.response.stdout !== "") {
                    this.variableObject.documentList.state = JSON.parse(resultJson.response.stdout);
                }
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiDocumentList() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;
            });
    };

    apiDocumentDelete = (index: number, fileName: string): void => {
        fetch(`${helperSrc.URL_MCP}/api/document-delete`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "mcp-session-id": session.data.mcpSessionId,
                Cookie: session.data.mcpCookie
            },
            body: JSON.stringify({ fileName }),
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        })
            .then(() => {
                this.variableObject.isOfflineMcp.state = false;

                this.variableObject.documentList.state = this.variableObject.documentList.state.filter((_, a) => a !== index);
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiDocumentDelete() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;
            });
    };

    apiDocumentRead = async (fileName: string, pageNumber: number): Promise<void | modelDocument.Iresult> => {
        return fetch(`${helperSrc.URL_MCP}/api/document-read`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "mcp-session-id": session.data.mcpSessionId,
                Cookie: session.data.mcpCookie
            },
            body: JSON.stringify({ fileName, pageNumber }),
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        })
            .then(async (result) => {
                this.variableObject.isOfflineMcp.state = false;

                const resultJson = (await result.json()) as modelIndex.IresponseBody;

                if (resultJson.response.stdout !== "") {
                    return JSON.parse(resultJson.response.stdout);
                }
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiDocumentRead() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;
            });
    };

    apiSkillUpload = async (): Promise<void> => {
        const pathFileList = await open({
            multiple: true,
            directory: false
        });

        if (pathFileList) {
            this.variableObject.isSkillUploading.state = true;
            this.variableObject.skillUploadStatusList.state = [];

            for (const pathFile of pathFileList) {
                const file = await readFile(pathFile);
                const fileName = pathFile.split(/[/\\]/).pop() || "file";
                const mimeType = helperSrc.readMimeType(file);
                const blob = new Blob([file], { type: mimeType.content });

                const formData = new FormData();
                formData.append("file", blob, `${fileName}`);

                await fetch(`${helperSrc.URL_MCP}/api/skill-upload`, {
                    method: "POST",
                    headers: {
                        "mcp-session-id": session.data.mcpSessionId,
                        Cookie: session.data.mcpCookie,
                        fileName
                    },
                    body: formData,
                    danger: {
                        acceptInvalidCerts: true,
                        acceptInvalidHostnames: true
                    }
                })
                    .then(async (result) => {
                        this.variableObject.isOfflineMcp.state = false;

                        const resultJson = (await result.json()) as modelIndex.IresponseBody;

                        if (resultJson.response.stdout !== "") {
                            this.variableObject.isSkillUploading.state = false;

                            const resultFile = JSON.parse(resultJson.response.stdout) as modelMcp.IfileStatus;

                            this.variableObject.skillUploadStatusList.state.push(resultFile);

                            this.apiSkillList();
                        }
                    })
                    .catch((error: Error) => {
                        helperSrc.writeLog("Mcp.ts - apiSkillUpload() - fetch() - catch()", error.message);

                        this.variableObject.isOfflineMcp.state = true;
                    });
            }
        }
    };

    apiSkillList = async (): Promise<void> => {
        fetch(`${helperSrc.URL_MCP}/api/skill-list`, {
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
            .then(async (result) => {
                this.variableObject.isOfflineMcp.state = false;

                const resultJson = (await result.json()) as modelIndex.IresponseBody;

                if (resultJson.response.stdout !== "") {
                    this.variableObject.skillList.state = JSON.parse(resultJson.response.stdout);
                }
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiSkillList() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;
            });
    };

    apiSkillDelete = (index: number, fileName: string): void => {
        fetch(`${helperSrc.URL_MCP}/api/skill-delete`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "mcp-session-id": session.data.mcpSessionId,
                Cookie: session.data.mcpCookie
            },
            body: JSON.stringify({ fileName }),
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        })
            .then(() => {
                this.variableObject.isOfflineMcp.state = false;

                this.variableObject.skillList.state = this.variableObject.skillList.state.filter((_, a) => a !== index);
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiSkillDelete() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;
            });
    };

    apiSkillRead = async (fileName: string): Promise<void | string> => {
        return fetch(`${helperSrc.URL_MCP}/api/skill-read`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "mcp-session-id": session.data.mcpSessionId,
                Cookie: session.data.mcpCookie
            },
            body: JSON.stringify({ fileName }),
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        })
            .then(async (result) => {
                this.variableObject.isOfflineMcp.state = false;

                const resultJson = (await result.json()) as modelIndex.IresponseBody;

                if (resultJson.response.stdout !== "") {
                    return resultJson.response.stdout;
                }
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiSkillRead() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;
            });
    };

    apiAgentCreate = async (agent: modelMcp.Iagent): Promise<void> => {
        await fetch(`${helperSrc.URL_MCP}/api/agent-create`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "mcp-session-id": session.data.mcpSessionId,
                Cookie: session.data.mcpCookie
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
            .then(async (result) => {
                this.variableObject.isOfflineMcp.state = false;

                const resultJson = (await result.json()) as modelIndex.IresponseBody;

                if (resultJson.response.stdout.toLowerCase() === "true") {
                    this.apiAgentList();

                    this.variableObject.agentForm.state = {} as modelMcp.Iagent;
                } else {
                    this.variableObject.agentFormResult.state = "Failed to create agent.";
                }
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiAgentCreate() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;
            });
    };

    apiAgentUpdate = async (agent: modelMcp.Iagent): Promise<void> => {
        await fetch(`${helperSrc.URL_MCP}/api/agent-update`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "mcp-session-id": session.data.mcpSessionId,
                Cookie: session.data.mcpCookie
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
            .then(async (result) => {
                this.variableObject.isOfflineMcp.state = false;

                const resultJson = (await result.json()) as modelIndex.IresponseBody;

                if (resultJson.response.stdout.toLowerCase() === "true") {
                    this.apiAgentList();

                    this.variableObject.agentForm.state = {} as modelMcp.Iagent;
                } else {
                    this.variableObject.agentFormResult.state = "Failed to save agent.";
                }
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiAgentUpdate() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;
            });
    };

    apiAgentList = async (): Promise<void> => {
        fetch(`${helperSrc.URL_MCP}/api/agent-list`, {
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
            .then(async (result) => {
                this.variableObject.isOfflineMcp.state = false;

                const resultJson = (await result.json()) as modelIndex.IresponseBody;

                if (resultJson.response.stdout !== "") {
                    this.variableObject.agentList.state = JSON.parse(resultJson.response.stdout);
                }
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiAgentList() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;
            });
    };

    apiAgentDelete = async (index: number, id: number): Promise<void> => {
        fetch(`${helperSrc.URL_MCP}/api/agent-delete`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "mcp-session-id": session.data.mcpSessionId,
                Cookie: session.data.mcpCookie
            },
            body: JSON.stringify({ id }),
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        })
            .then(() => {
                this.variableObject.isOfflineMcp.state = false;

                this.variableObject.agentList.state = this.variableObject.agentList.state.filter((_, a) => a !== index);
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - apiAgentDelete() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;
            });
    };

    constructor() {
        this.variableObject = {} as modelMcp.Ivariable;
        this.methodObject = {} as modelMcp.Imethod;
        this.viewNodeEmpty = { tag: "div", propertyObject: {}, childrenList: [] };
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
                isDocumentUploading: variableLink<boolean>("MenuItem"),
                documentUploadStatusList: variableLink<modelMcp.IfileStatus[]>("MenuItem"),
                documentEmbeddingStatusList: variableLink<modelMcp.IfileStatus[]>("MenuItem"),
                skillList: [],
                isSkillUploading: variableLink<boolean>("MenuItem"),
                skillUploadStatusList: variableLink<modelMcp.IfileStatus[]>("MenuItem"),
                agentForm: variableLink<modelMcp.Iagent>("MenuItem"),
                agentFormResult: variableLink<string>("MenuItem"),
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
