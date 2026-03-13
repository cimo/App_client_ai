import { Icontroller, IvariableEffect, IvirtualNode, variableBind } from "@cimo/jsmvcfw/dist/src/Main.js";
import { getCurrentWindow, CloseRequestedEvent, type Window } from "@tauri-apps/api/window";
//import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { readFile } from "@tauri-apps/plugin-fs";
import { fetch } from "@tauri-apps/plugin-http";
import { openUrl } from "@tauri-apps/plugin-opener";

// Source
import * as helperSrc from "../HelperSrc";
import * as modelIndex from "../model/Index";
import viewIndex from "../view/Index";
import ControllerAi from "./Ai";
import ControllerMcp from "./Mcp";
import ControllerMenuItem from "./MenuItem";

export default class Index implements Icontroller {
    // Variable
    private variableObject: modelIndex.Ivariable;
    private methodObject: modelIndex.Imethod;
    private controllerAi: ControllerAi;
    private controllerMcp: ControllerMcp;
    private controllerMenuItem: ControllerMenuItem;

    private responseId: string;
    private responseReason: string;
    private responseNoReason: string;
    private responseMcpTool: modelIndex.IapiAiResponseTool;

    private abortControllerApiAiResponse: AbortController | null;

    private aiBearerToken: string;
    private aiCookie: string;
    private mcpSessionId: string;
    private mcpCookie: string;

    private appWindow: Window;
    private appIsClosing: boolean;

    // Method
    private onClickAd = (event: Event): void => {
        event.preventDefault();

        if (helperSrc.IS_DEBUG) {
            this.variableObject.adUrl.state = "";
        } else {
            openUrl(this.variableObject.adUrl.state);
        }
    };

    private onClickRefreshPage = (): void => {
        window.location.reload();
    };

    private generateUniqueId = (): string => {
        const timestamp = Date.now().toString(36);
        const randomPart = crypto.getRandomValues(new Uint32Array(1))[0].toString(36);

        return `${timestamp}-${randomPart}`;
    };

    private apiAiLogin = async (): Promise<void | Response> => {
        return fetch(`${helperSrc.URL_AI}/login`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${this.aiBearerToken}`
            },
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        })
            .then(async (result) => {
                this.variableObject.isOfflineAi.state = false;

                const cookie = result.headers.get("set-cookie");

                this.aiCookie = cookie ? cookie : "";

                const resultJson = (await result.json()) as modelIndex.IresponseBody;

                this.variableObject.adUrl.state = resultJson.response.stdout;
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Index.ts - apiAiLogin() - fetch() - catch()", error.message);

                this.variableObject.isOfflineAi.state = true;
            });
    };

    private apiAiUserInfo = async (): Promise<void | Response> => {
        return fetch(`${helperSrc.URL_AI}/user-info`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${this.aiBearerToken}`,
                Cookie: this.aiCookie
            },
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        })
            .then(async (result) => {
                this.variableObject.isOfflineAi.state = false;

                const resultJson = (await result.json()) as modelIndex.IresponseBody;

                // eslint-disable-next-line no-console
                console.log("cimo - apiAiUserInfo()", resultJson);
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Index.ts - apiAiUserInfo() - fetch() - catch()", error.message);

                this.variableObject.isOfflineAi.state = true;
            });
    };

    private apiAiModel = (): void => {
        fetch(`${helperSrc.URL_AI}/api/model`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${this.aiBearerToken}`,
                Cookie: this.aiCookie
            },
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        })
            .then(async (result) => {
                this.variableObject.isOfflineAi.state = false;

                const resultJson = (await result.json()) as modelIndex.IresponseBody;
                const jsonParse = JSON.parse(resultJson.response.stdout) as modelIndex.IapiAiModel[];
                const resultCleaned = [];

                for (const value of jsonParse) {
                    if (value.id.toLowerCase().includes("embedding")) {
                        continue;
                    }

                    resultCleaned.push(value);
                }

                this.variableObject.modelList.state = [...resultCleaned].sort((a, b) => a.id.localeCompare(b.id));

                this.variableObject.isOpenDropdownModelList.state = true;
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Index.ts - apiAiModel() - fetch() - catch()", error.message);

                this.variableObject.isOfflineAi.state = true;
            });
    };

    private apiAiResponse = (): void => {
        //const base64 = await invoke("test_screenshot");
        //this.variableObject.modelSelected.state = base64 as string;

        //await invoke("test");

        if (this.hookObject.elementInputMessageSend.value && this.variableObject.modelSelected.state !== "") {
            this.abortControllerApiAiResponse = new AbortController();

            this.resetModelResponse();

            this.variableObject.chatMessageList.state.push({
                time: helperSrc.localeFormat(new Date()) as string,
                user: this.hookObject.elementInputMessageSend.value,
                assistantReason: this.responseReason,
                assistantNoReason: this.responseNoReason,
                mcpTool: this.responseMcpTool,
                file: ""
            });

            this.autoscroll(false);

            const input: modelIndex.IchatInput[] = [];

            /*this.variableObject.chatHistoryList.state.push({
                role: "user",
                content: this.hookObject.elementInputMessageSend.value
            });
            
            for (const chatHistoryList of this.variableObject.chatHistoryList.state) {
                if (chatHistoryList.role === "system" || chatHistoryList.role === "user") {
                    input.push({
                        role: chatHistoryList.role,
                        content: [{ type: "input_text", text: chatHistoryList.content as string }]
                    });
                } else {
                    input.push({
                        role: chatHistoryList.role,
                        content: [{ type: "output_text", text: chatHistoryList.content as string }]
                    });
                }
            }*/

            let inputSystem = "";

            if (this.variableObject.systemMode.state === "chat") {
                inputSystem = [
                    "You are a multilingual assistant that needs to reply with the user input language.",
                    "You MUST need to reason step by step and give a answer to the user question.",
                    "You MUST NOT use tools and tasks."
                ].join("\n");
            } else if (this.variableObject.systemMode.state === "tool-call") {
                inputSystem = [
                    "You are a multilingual assistant tool executer that needs to reply with the user input language and you need to transform the user request in a action.",
                    `You MUST use ONLY the following tool: ${this.variableObject.toolSelected.state.name}.`,
                    `For ${this.variableObject.toolSelected.state.name} you MUST return ONLY valid JSON with this format without additional information: { "name": "${this.variableObject.toolSelected.state.name}", "argumentObject": ${JSON.stringify(this.variableObject.toolSelected.state.argumentObject)} }`,
                    "You MUST NOT solve problems.",
                    "You MUST NOT invent new actions.",
                    "You MUST NOT explain nothing."
                ].join("\n");
            } else if (this.variableObject.systemMode.state === "tool-task") {
                inputSystem = [
                    "You are a multilingual assistant tool task executer that needs to reply with the user input language and you need to transform the user request in a ordered list of actions.",
                    "You MUST use ONLY the following tool: chrome.",
                    'For chrome you MUST return ONLY valid JSON with this format without additional information: { "list": [ { "name": "chrome", "argumentObject": { "url": "..." } } ] }',
                    "You MUST NOT solve problems.",
                    "You MUST NOT invent new actions.",
                    "You MUST NOT explain nothing."
                ].join("\n");
            } else if (this.variableObject.systemMode.state === "agent-skill") {
                inputSystem = [
                    "You are a multilingual agent skill executer that needs to reply with the user input language and you need to transform the user request in a action.",
                    'If you find a tag [script](...) in the text you MUST stop and write ONLY valid JSON with this format without additional information: { "action": { "script": true } }'
                ].join("\n");
            }

            input.push(
                {
                    role: "system",
                    content: [
                        {
                            type: "input_text",
                            text: inputSystem
                        }
                    ]
                },
                {
                    role: "user",
                    content: [{ type: "input_text", text: this.hookObject.elementInputMessageSend.value }]
                }
            );

            fetch(`${helperSrc.URL_AI}/api/response`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${this.aiBearerToken}`,
                    Cookie: this.aiCookie,
                    "mcp-session-id": this.mcpSessionId,
                    "cookie-mcp": this.mcpCookie
                },
                body: JSON.stringify({
                    stream: true,
                    model: this.variableObject.modelSelected.state,
                    input,
                    tools: []
                }),
                signal: this.abortControllerApiAiResponse.signal,
                danger: {
                    acceptInvalidCerts: true,
                    acceptInvalidHostnames: true
                }
            })
                .then(async (result) => {
                    this.variableObject.isOfflineAi.state = false;

                    this.variableObject.isMessageSent.state = true;

                    const contentType = result.headers.get("Content-Type");

                    if (!contentType || !contentType.includes("text/event-stream") || !result.body) {
                        helperSrc.writeLog("Index.ts - apiAiResponse() - fetch() - Error", "Missing or invalid headers.");

                        return;
                    }

                    const reader = result.body.getReader();
                    const decoder = new TextDecoder("utf-8");
                    let buffer = "";

                    while (true) {
                        const { value, done } = await reader.read();

                        if (done) {
                            this.resetModelResponse();

                            break;
                        }

                        buffer += decoder.decode(value, { stream: true });
                        const lineList = buffer.split(/\r?\n/);
                        buffer = lineList.pop() || "";

                        for (const line of lineList) {
                            if (line.startsWith("data:")) {
                                const data = line.slice(5).trim();

                                const dataTrim = data.trim();

                                if (dataTrim.length > 1 && dataTrim[0] === "{" && dataTrim[dataTrim.length - 1] === "}") {
                                    const dataTrimParse = JSON.parse(dataTrim) as modelIndex.IapiAiResponse;

                                    if (dataTrimParse.type === "error") {
                                        const dataError = dataTrimParse.error;

                                        if (dataError) {
                                            const idx = this.variableObject.chatMessageList.state.length - 1;

                                            this.variableObject.chatMessageList.state[idx] = {
                                                ...this.variableObject.chatMessageList.state[idx],
                                                assistantNoReason: dataError.message
                                            };

                                            this.autoscroll(false);
                                        }
                                    } else if (dataTrimParse.type === "response.created") {
                                        const dataResponse = dataTrimParse.response;

                                        if (dataResponse) {
                                            this.responseId = dataResponse.id;
                                        }
                                    } else if (dataTrimParse.type === "response.reasoning_text.delta") {
                                        const dataDelta = dataTrimParse.delta;

                                        if (dataDelta) {
                                            this.responseReason += dataDelta;

                                            const index = this.variableObject.chatMessageList.state.length - 1;

                                            this.variableObject.chatMessageList.state[index] = {
                                                ...this.variableObject.chatMessageList.state[index],
                                                assistantReason: this.responseReason.trim()
                                            };

                                            this.autoscroll(true);
                                        }
                                    } else if (dataTrimParse.type === "response.output_text.delta") {
                                        const dataDelta = dataTrimParse.delta;

                                        if (dataDelta) {
                                            this.responseNoReason += dataDelta;

                                            const index = this.variableObject.chatMessageList.state.length - 1;

                                            this.variableObject.chatMessageList.state[index] = {
                                                ...this.variableObject.chatMessageList.state[index],
                                                assistantNoReason: this.responseNoReason.trim()
                                            };

                                            this.autoscroll(true);
                                        }
                                    } else if (dataTrimParse.type === "response.output_item.done") {
                                        const dataItem = dataTrimParse.item;

                                        if (dataItem && dataItem.type === "mcp_call") {
                                            this.responseMcpTool = {
                                                tool_call_id: dataItem.tool_call_id,
                                                type: dataItem.type,
                                                name: dataItem.name,
                                                arguments: dataItem.arguments,
                                                output: dataItem.output
                                            };

                                            const index = this.variableObject.chatMessageList.state.length - 1;

                                            this.variableObject.chatMessageList.state[index] = {
                                                ...this.variableObject.chatMessageList.state[index],
                                                mcpTool: this.responseMcpTool
                                            };

                                            this.autoscroll(true);
                                        }
                                    } else if (dataTrimParse.type === "response.completed") {
                                        this.autoscroll(false);
                                    } else if (dataTrimParse.type === "tool_response") {
                                        const dataResponse = dataTrimParse.response.message;

                                        if (dataResponse) {
                                            const index = this.variableObject.chatMessageList.state.length - 1;

                                            this.variableObject.chatMessageList.state[index] = {
                                                ...this.variableObject.chatMessageList.state[index],
                                                assistantNoReason: dataResponse
                                            };
                                        }

                                        this.autoscroll(false);
                                    }
                                }
                            }
                        }
                    }
                })
                .catch((error: Error) => {
                    helperSrc.writeLog("Index.ts - apiAiResponse() - fetch() - catch()", typeof error === "string" ? error : error.message);

                    this.resetModelResponse();

                    if (error.toString().toLowerCase() === "request cancelled") {
                        const idx = this.variableObject.chatMessageList.state.length - 1;

                        this.variableObject.chatMessageList.state[idx] = {
                            ...this.variableObject.chatMessageList.state[idx],
                            assistantNoReason: "Stop by user"
                        };

                        return;
                    }

                    this.variableObject.isOfflineAi.state = true;
                });

            this.hookObject.elementInputMessageSend.value = "";
        }
    };

    private apiAiLogout = async (): Promise<void | Response> => {
        return fetch(`${helperSrc.URL_AI}/logout`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${this.aiBearerToken}`,
                Cookie: this.aiCookie
            },
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        })
            .then(() => {
                this.variableObject.isOfflineAi.state = false;

                this.aiBearerToken = "";
                this.aiCookie = "";
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Index.ts - apiAiLogout() - fetch() - catch()", error.message);

                this.variableObject.isOfflineAi.state = true;
            });
    };

    private apiMcpLogin = async (): Promise<void | Response> => {
        return fetch(`${helperSrc.URL_MCP}/login`, {
            method: "GET",
            headers: {
                "mcp-session-id": this.mcpSessionId
            },
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        })
            .then(async (result) => {
                this.variableObject.isOfflineMcp.state = false;

                const cookie = result.headers.get("set-cookie");

                this.mcpCookie = cookie ? cookie : "";

                const resultJson = (await result.json()) as modelIndex.IresponseBody;

                this.mcpSessionId = resultJson.response.stdout;

                localStorage.setItem("mcp-session-id", this.mcpSessionId);
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Index.ts - apiMcpLogin() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;
            });
    };

    private apiMcpTool = async (): Promise<void | Response> => {
        return fetch(`${helperSrc.URL_MCP}/api/tool-list`, {
            method: "GET",
            headers: {
                "mcp-session-id": this.mcpSessionId,
                Cookie: this.mcpCookie
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
                    this.variableObject.toolList.state = JSON.parse(resultJson.response.stdout) as modelIndex.IapiMcpTool[];
                }
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Index.ts - apiMcpTool() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;
            });
    };

    private apiMcpUpload = async (): Promise<void> => {
        const pathFileList = await open({
            multiple: true,
            directory: false
        });

        if (pathFileList) {
            let fileList: string[] = [];

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
                        "mcp-session-id": this.mcpSessionId,
                        Cookie: this.mcpCookie
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
                            fileList.push(resultJson.response.stdout);
                        }
                    })
                    .catch((error: Error) => {
                        helperSrc.writeLog("Index.ts - apiMcpUpload() - fetch() - catch()", error.message);

                        this.variableObject.isOfflineMcp.state = true;
                    });
            }

            if (fileList.length > 0) {
                const message = {} as modelIndex.IchatMessage;
                message.file = JSON.stringify(fileList);

                this.variableObject.chatMessageList.state.push(message);

                this.autoscroll(false);
            } else {
                const message = {} as modelIndex.IchatMessage;
                message.assistantNoReason = "Error: File write problem.";
                message.file = "";

                this.variableObject.chatMessageList.state.push(message);

                this.autoscroll(false);
            }
        }
    };

    apiMcpFileUploaded = async (): Promise<void> => {
        fetch(`${helperSrc.URL_MCP}/api/file-uploaded`, {
            method: "GET",
            headers: {
                "mcp-session-id": this.mcpSessionId,
                Cookie: this.mcpCookie
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
                helperSrc.writeLog("Index.ts - apiMcpFileUploaded() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;
            });
    };

    apiMcpFileUploadedDelete = (index: number, fileName: string): void => {
        fetch(`${helperSrc.URL_MCP}/api/file-uploaded-delete`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "mcp-session-id": this.mcpSessionId,
                Cookie: this.mcpCookie
            },
            body: JSON.stringify({ fileName }),
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        })
            .then(async () => {
                this.variableObject.isOfflineMcp.state = false;

                this.variableObject.fileUploadedList.state = this.variableObject.fileUploadedList.state.filter((_, a) => a !== index);
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Index.ts - apiMcpFileUploadedDelete() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;
            });
    };

    private apiMcpLogout = async (): Promise<void | Response> => {
        return fetch(`${helperSrc.URL_MCP}/logout`, {
            method: "GET",
            headers: {
                "mcp-session-id": this.mcpSessionId,
                Cookie: this.mcpCookie
            },
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        })
            .then(() => {
                this.variableObject.isOfflineMcp.state = false;

                this.mcpSessionId = "";
                this.mcpCookie = "";

                localStorage.removeItem("mcp-session-id");
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Index.ts - apiMcpLogout() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;
            });
    };

    private resetModelResponse = (): void => {
        this.responseId = "";
        this.responseReason = "";
        this.responseNoReason = "";
        this.responseMcpTool = {} as modelIndex.IapiAiResponseTool;

        this.variableObject.isMessageSent.state = false;
    };

    private autoscroll = (isAuto: boolean): void => {
        const elementContainerMessageReceive = this.hookObject.elementContainerMessageReceive;
        const elementBottomLimit = this.hookObject.elementBottomLimit;

        const difference =
            elementContainerMessageReceive.scrollHeight - (elementContainerMessageReceive.scrollTop + elementContainerMessageReceive.clientHeight);
        const threshold = 50;
        const isAtBottom = difference <= threshold;

        elementContainerMessageReceive.dataset["autoScroll"] = isAtBottom ? "true" : "false";

        requestAnimationFrame(() => {
            if (elementContainerMessageReceive.dataset["autoScroll"] === "false" && isAuto) {
                return;
            }

            elementBottomLimit.scrollIntoView({ block: "end", inline: "nearest" });
        });
    };

    private onClickButtonMessageSend = (): void => {
        if (this.abortControllerApiAiResponse && this.responseId) {
            this.abortControllerApiAiResponse.abort();
            this.abortControllerApiAiResponse = null;
        } else {
            this.apiAiResponse();
        }
    };

    private onClickDropdownModel = (): void => {
        this.apiAiModel();
    };

    private onClickModelName = (name: string): void => {
        this.variableObject.modelSelected.state = name;
    };

    private onClickChipUpload = (): void => {
        this.apiMcpUpload();
    };

    private onClickToolClose = (): void => {
        this.variableObject.toolSelected.state = {} as modelIndex.IapiMcpTool;
        this.variableObject.systemMode.state = "chat";
    };
    //...
    private onClickChipTask = (): void => {
        if (this.variableObject.systemMode.state === "tool-call") {
            return;
        }

        this.variableObject.systemMode.state = this.variableObject.systemMode.state === "tool-task" ? "chat" : "tool-task";
    };
    //...

    constructor() {
        this.variableObject = {} as modelIndex.Ivariable;
        this.methodObject = {} as modelIndex.Imethod;
        this.controllerAi = new ControllerAi();
        this.controllerMcp = new ControllerMcp();
        this.controllerMenuItem = new ControllerMenuItem(this);

        this.responseId = "";
        this.responseReason = "";
        this.responseNoReason = "";
        this.responseMcpTool = {} as modelIndex.IapiAiResponseTool;

        this.abortControllerApiAiResponse = null;

        this.aiBearerToken = this.generateUniqueId();
        this.aiCookie = "";
        this.mcpSessionId = localStorage.getItem("mcp-session-id") || "";
        this.mcpCookie = "";

        this.appWindow = getCurrentWindow();
        this.appIsClosing = false;
    }

    hookObject = {} as modelIndex.IelementHook;

    variable(): void {
        this.variableObject = variableBind(
            {
                isOfflineAi: false,
                isOfflineMcp: false,
                modelList: [],
                isOpenDropdownModelList: false,
                modelSelected: helperSrc.MODEL_DEFAULT,
                chatMessageList: [],
                chatHistoryList: [],
                toolList: [],
                toolSelected: {} as modelIndex.IapiMcpTool,
                adUrl: "",
                systemMode: "chat",
                isMessageSent: false,
                fileUploadedList: []
            },
            this.constructor.name
        );

        this.methodObject = {
            onClickAd: this.onClickAd,
            onClickRefreshPage: this.onClickRefreshPage,
            onClickDropdownModel: this.onClickDropdownModel,
            onClickModelName: this.onClickModelName,
            onClickButtonMessageSend: this.onClickButtonMessageSend,
            onClickChipUpload: this.onClickChipUpload,
            onClickToolClose: this.onClickToolClose,
            onClickChipTask: this.onClickChipTask
        };
    }

    variableEffect(watch: IvariableEffect): void {
        watch([]);
    }

    view(): IvirtualNode {
        return viewIndex(this.variableObject, this.methodObject);
    }

    event(): void {
        document.addEventListener("click", (event) => {
            const target = event.target as HTMLElement;

            if (!helperSrc.findElementParent(target, "dropdown") || helperSrc.findElementParent(target, "menu")) {
                this.variableObject.isOpenDropdownModelList.state = false;
            }
        });

        this.appWindow.onCloseRequested(async (event: CloseRequestedEvent) => {
            if (this.appIsClosing) {
                return;
            }

            event.preventDefault();

            this.appIsClosing = true;

            await this.apiAiLogout();

            await this.apiMcpLogout();

            await this.appWindow.close();
        });
    }

    subControllerList(): Icontroller[] {
        const resultList: Icontroller[] = [];

        resultList.push(this.controllerAi);
        resultList.push(this.controllerMcp);
        resultList.push(this.controllerMenuItem);

        return resultList;
    }

    rendered(): void {
        (async () => {
            await this.apiAiLogin();

            await this.apiAiUserInfo();

            await this.apiMcpLogin();

            await this.apiMcpTool();
        })();
    }

    destroy(): void {
        (async () => {
            await this.apiAiLogout();

            await this.apiMcpLogout();
        })();
    }
}
