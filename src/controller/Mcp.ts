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
import type Chat from "./Chat";

export default class Mcp implements Icontroller {
    // Variable
    private variableObject: modelMcp.Ivariable;
    private methodObject: modelMcp.Imethod;
    private viewNodeEmpty: IvirtualNode;
    private controllerChat: Chat;

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
                helperSrc.writeLog("Index.ts - apiEmbeddingCheck() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;

                return "fail";
            });
    };

    private startEmbeddingCheck = (embeddingFileList: modelMcp.IfileStatus[], embeddingMessageIndex: number): void => {
        const embeddingFileListIndex = embeddingFileList.length - 1;

        let isPolling = false;
        let embeddingStatus = "ongoing";

        const interval = setInterval(async () => {
            if (isPolling) {
                return;
            }

            isPolling = true;

            embeddingStatus = await this.apiEmbeddingCheck(embeddingFileList[embeddingFileListIndex].fileName);

            if (embeddingStatus === "done") {
                embeddingFileList[embeddingFileListIndex].status = "Success";
            } else if (embeddingStatus === "fail") {
                embeddingFileList[embeddingFileListIndex].status = "Failed";
            }

            this.variableObject.chatMessageList.state[embeddingMessageIndex].embedding = JSON.stringify(embeddingFileList);

            this.controllerChat.autoscroll(false);

            if (embeddingStatus !== "ongoing") {
                if (interval) {
                    clearInterval(interval);
                }
            }

            isPolling = false;
        }, 1000);
    };

    private onClickChipUpload = async (): Promise<void> => {
        await this.apiUpload();
    };

    private onClickChipClose = (): void => {
        this.variableObject.toolSelected.state = {} as modelMcp.Itool;
        this.variableObject.taskSelected.state = {} as modelMcp.Itask;

        this.variableObject.systemMode.state = "chat";
    };

    getVariableObject(): modelMcp.Ivariable {
        return this.variableObject;
    }

    setControllerChat(controller: Chat): void {
        this.controllerChat = controller;
    }

    apiLogin = async (): Promise<void | Response> => {
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
                helperSrc.writeLog("Index.ts - apiLogin() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;
            });
    };

    apiTool = async (): Promise<void | Response> => {
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
                helperSrc.writeLog("Index.ts - apiTool() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;
            });
    };

    apiTask = async (): Promise<void | Response> => {
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
                helperSrc.writeLog("Index.ts - apiTask() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;
            });
    };

    apiUpload = async (): Promise<void> => {
        const pathFileList = await open({
            multiple: true,
            directory: false
        });

        if (pathFileList) {
            const uploadMessage = {} as modelChat.IchatMessage;
            uploadMessage.assistantNoReason = "";
            this.variableObject.chatMessageList.state.push(uploadMessage);
            const uploadMessageIndex = this.variableObject.chatMessageList.state.length - 1;

            const embeddingMessage = {} as modelChat.IchatMessage;
            embeddingMessage.assistantNoReason = " ";
            this.variableObject.chatMessageList.state.push(embeddingMessage);
            const embeddingMessageIndex = this.variableObject.chatMessageList.state.length - 1;

            let uploadFileList: modelMcp.IfileStatus[] = [];
            let embeddingFileList: modelMcp.IfileStatus[] = [];

            for (const pathFile of pathFileList) {
                const file = await readFile(pathFile);
                const mimeType = helperSrc.readMimeType(file);
                const blob = new Blob([file], { type: mimeType.content });
                const fileName = pathFile.split(/[/\\]/).pop() || "file";

                const formData = new FormData();
                formData.append("file", blob, `${fileName}`);

                await fetch(`${helperSrc.URL_MCP}/api/upload`, {
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
                            const resultFile = JSON.parse(resultJson.response.stdout) as modelMcp.IfileStatus;

                            uploadFileList.push(resultFile);

                            this.variableObject.chatMessageList.state[uploadMessageIndex].assistantNoReason = "Upload result:";
                            this.variableObject.chatMessageList.state[uploadMessageIndex].file = JSON.stringify(uploadFileList);

                            if (resultFile.status === "Success") {
                                embeddingFileList.push({ fileName: resultFile.fileName, status: "Ongoing" });

                                this.variableObject.chatMessageList.state[embeddingMessageIndex].assistantNoReason = "Embedding result:";
                                this.variableObject.chatMessageList.state[embeddingMessageIndex].embedding = JSON.stringify(embeddingFileList);

                                this.startEmbeddingCheck(embeddingFileList, embeddingMessageIndex);
                            }
                        }
                    })
                    .catch((error: Error) => {
                        helperSrc.writeLog("Index.ts - apiUpload() - fetch() - catch()", error.message);

                        this.variableObject.isOfflineMcp.state = true;
                    });
            }

            this.controllerChat.autoscroll(false);
        }
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
                helperSrc.writeLog("Index.ts - apiLogout() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;
            });
    };

    apiFileUploaded = async (): Promise<void> => {
        fetch(`${helperSrc.URL_MCP}/api/file-uploaded`, {
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
                    this.variableObject.fileUploadedList.state = JSON.parse(resultJson.response.stdout);
                }
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Index.ts - apiFileUploaded() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;
            });
    };

    apiFileUploadedDelete = (index: number, fileName: string): void => {
        fetch(`${helperSrc.URL_MCP}/api/file-uploaded-delete`, {
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

                this.variableObject.fileUploadedList.state = this.variableObject.fileUploadedList.state.filter((_, a) => a !== index);
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Index.ts - apiFileUploadedDelete() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;
            });
    };

    apiFileRead = async (fileName: string, pageNumber: number): Promise<void | modelDocument.Iresult> => {
        return fetch(`${helperSrc.URL_MCP}/api/file-read`, {
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
                helperSrc.writeLog("Mcp.ts - apiFileRead() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;
            });
    };

    constructor() {
        this.variableObject = {} as modelMcp.Ivariable;
        this.methodObject = {} as modelMcp.Imethod;
        this.viewNodeEmpty = { tag: "div", propertyObject: {}, childrenList: [] };
        this.controllerChat = {} as Chat;
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
                fileUploadedList: [],
                systemMode: variableLink<string>("Chat"),
                chatMessageList: variableLink<modelChat.IchatMessage[]>("Chat")
            },
            this.constructor.name
        );

        this.methodObject = {
            onClickChipUpload: this.onClickChipUpload,
            onClickChipClose: this.onClickChipClose
        };
    }

    variableEffect(watch: IvariableEffect): void {
        watch([]);
    }

    view(name?: string): IvirtualNode {
        if (name === "tool") {
            return viewMcp.tool(this.variableObject, this.methodObject);
        } else if (name === "upload") {
            return viewMcp.upload(this.variableObject, this.methodObject);
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
