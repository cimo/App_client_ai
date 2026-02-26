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

export default class Index implements Icontroller {
    // Variable
    private variableObject: modelIndex.Ivariable;
    private methodObject: modelIndex.Imethod;

    private responseId: string;
    private responseReason: string;
    private responseNoReason: string;
    private responseMcpTool: modelIndex.IapiAiResponseItem;

    private abortControllerApiAiResponse: AbortController | null;

    private aiBearerToken: string;
    private aiCookie: string;
    private mcpCookie: string;
    private mcpSessionId: string;

    private appWindow: Window;
    private appIsClosing: boolean;

    // Method
    private resetModelResponse = (): void => {
        this.responseId = "";
        this.responseReason = "";
        this.responseNoReason = "";
        this.responseMcpTool = {} as modelIndex.IapiAiResponseItem;
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

    private generateUniqueId = (): string => {
        const timestamp = Date.now().toString(36);
        const randomPart = crypto.getRandomValues(new Uint32Array(1))[0].toString(36);

        return `${timestamp}-${randomPart}`;
    };

    private apiAiLogin = async (): Promise<void | Response> => {
        return fetch(`${helperSrc.URL_AI}/login`, {
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
                const cookie = result.headers.get("set-cookie");

                this.variableObject.isOfflineAi.state = false;

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

                this.variableObject.isOpenDialogModelList.state = !this.variableObject.isOpenDialogModelList.state;
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

            this.variableObject.chatMessage.state.push({
                time: helperSrc.localeFormat(new Date()) as string,
                user: this.hookObject.elementInputMessageSend.value,
                assistantReason: this.responseReason,
                assistantNoReason: this.responseNoReason,
                mcpTool: this.responseMcpTool,
                file: ""
            });

            this.autoscroll(false);

            const input: modelIndex.IchatInput[] = [];

            /*this.variableObject.chatHistory.state.push({
                role: "user",
                content: this.hookObject.elementInputMessageSend.value
            });
            
            for (const chatHistory of this.variableObject.chatHistory.state) {
                if (chatHistory.role === "system" || chatHistory.role === "user") {
                    input.push({
                        role: chatHistory.role,
                        content: [{ type: "input_text", text: chatHistory.content as string }]
                    });
                } else {
                    input.push({
                        role: chatHistory.role,
                        content: [{ type: "output_text", text: chatHistory.content as string }]
                    });
                }
            }*/

            let inputSystem = "";
            let inputToolList: modelIndex.Itool[] = [];

            if (this.variableObject.agentMode.state === "chat") {
                inputSystem =
                    "You are a multilingual agent that needs to speak in the user's input language.\n" +
                    "You MUST need to reason step by step and give a answer to the user question.\n" +
                    "You MUST NOT use tools.";

                inputToolList = [];
            } else if (this.variableObject.agentMode.state === "tool-call") {
                inputSystem =
                    "You are a agent tool and you only need to decide which single tool to call.\n" +
                    "You MUST NOT solve problems.\n" +
                    "You MUST NOT invent new actions.\n" +
                    "You MUST NOT explain nothing.\n" +
                    "If no action is executed, you MUST reply with: No tool to execute.\n" +
                    "If you can read the action response, you MUST reply with the tool response.";

                inputToolList = [
                    {
                        type: "mcp",
                        server_label: helperSrc.TOOL_SERVER_LABEL,
                        server_url: helperSrc.TOOL_SERVER_URL,
                        allowed_tools: helperSrc.TOOL_SERVER_ALLOWED,
                        headers: {
                            Cookie: this.mcpCookie
                        }
                    }
                ];
            } else if (this.variableObject.agentMode.state === "tool-task") {
                inputSystem =
                    "You are a agent control planner, transform the user request in a ordered list of actions for task execution.\n" +
                    "You MUST use ONLY the following actions: chrome_execute.\n" +
                    'For chrome_execute you MUST return ONLY valid JSON with this format: { "stepList": [ { "action": "chrome_execute", "argumentObject": { "url": "..." } } ] }\n' +
                    "You MUST NOT solve problems.\n" +
                    "You MUST NOT invent new actions.\n" +
                    "You MUST NOT explain nothing.\n" +
                    "If no action is executed, you MUST reply with: No task to execute.";

                inputToolList = [];
            }

            input.push({
                role: "system",
                content: [
                    {
                        type: "input_text",
                        text: inputSystem
                    }
                ]
            });

            input.push({
                role: "user",
                content: [{ type: "input_text", text: this.hookObject.elementInputMessageSend.value }]
            });

            fetch(`${helperSrc.URL_AI}/api/response`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${this.aiBearerToken}`,
                    Cookie: this.aiCookie,
                    "cookie-mcp": this.mcpCookie,
                    "mcp-session-id": this.mcpSessionId
                },
                body: JSON.stringify({
                    input,
                    model: this.variableObject.modelSelected.state,
                    temperature: 0,
                    stream: true,
                    tools: inputToolList
                }),
                signal: this.abortControllerApiAiResponse.signal,
                danger: {
                    acceptInvalidCerts: true,
                    acceptInvalidHostnames: true
                }
            })
                .then(async (result) => {
                    this.variableObject.isOfflineAi.state = false;

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
                                            const idx = this.variableObject.chatMessage.state.length - 1;

                                            this.variableObject.chatMessage.state[idx] = {
                                                ...this.variableObject.chatMessage.state[idx],
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

                                            const index = this.variableObject.chatMessage.state.length - 1;

                                            this.variableObject.chatMessage.state[index] = {
                                                ...this.variableObject.chatMessage.state[index],
                                                assistantReason: this.responseReason.trim()
                                            };

                                            this.autoscroll(true);
                                        }
                                    } else if (dataTrimParse.type === "response.output_text.delta") {
                                        const dataDelta = dataTrimParse.delta;

                                        if (dataDelta) {
                                            this.responseNoReason += dataDelta;

                                            const index = this.variableObject.chatMessage.state.length - 1;

                                            this.variableObject.chatMessage.state[index] = {
                                                ...this.variableObject.chatMessage.state[index],
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

                                            const index = this.variableObject.chatMessage.state.length - 1;

                                            this.variableObject.chatMessage.state[index] = {
                                                ...this.variableObject.chatMessage.state[index],
                                                mcpTool: this.responseMcpTool
                                            };

                                            this.autoscroll(true);
                                        }
                                    } else if (dataTrimParse.type === "response.completed") {
                                        this.autoscroll(false);
                                    } else if (dataTrimParse.type === "task_response") {
                                        const dataResponse = dataTrimParse.response;

                                        if (dataResponse) {
                                            const index = this.variableObject.chatMessage.state.length - 1;

                                            this.variableObject.chatMessage.state[index] = {
                                                ...this.variableObject.chatMessage.state[index],
                                                assistantNoReason: dataResponse.message
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
                    helperSrc.writeLog("Index.ts - apiAiResponse() - fetch() - catch()", error.message);

                    this.variableObject.isOfflineAi.state = true;

                    this.resetModelResponse();
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
                this.variableObject.isOfflineAi.state = true;

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
                Cookie: this.mcpCookie
            },
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        })
            .then(async (result) => {
                const cookie = result.headers.get("set-cookie");

                this.variableObject.isOfflineMcp.state = false;

                this.mcpCookie = cookie ? cookie : "";

                const resultJson = (await result.json()) as modelIndex.IresponseBody;

                this.mcpSessionId = resultJson.response.stdout;
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Index.ts - apiMcpLogin() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;
            });
    };

    private apiMcpUpload = async (): Promise<void> => {
        let resultList: string[] = [];

        const filePathList = await open({
            multiple: true,
            directory: false
        });

        if (filePathList) {
            for (const filePath of filePathList) {
                const file = await readFile(filePath);
                const mimeType = helperSrc.readMimeType(file);
                const blob = new Blob([file], { type: mimeType.content });
                const fileName = filePath.split(/[/\\]/).pop() || "file";

                const formData = new FormData();
                formData.append("file", blob, `${fileName}`);

                await fetch(`${helperSrc.URL_MCP}/api/upload`, {
                    method: "POST",
                    headers: {
                        Cookie: this.mcpCookie,
                        "mcp-session-id": this.mcpSessionId
                    },
                    body: formData,
                    danger: {
                        acceptInvalidCerts: true,
                        acceptInvalidHostnames: true
                    }
                })
                    .then(async (result) => {
                        const resultJson = (await result.json()) as modelIndex.IresponseBody;

                        resultList.push(resultJson.response.stdout);
                    })
                    .catch((error: Error) => {
                        helperSrc.writeLog("Index.ts - apiMcpUpload() - fetch() - catch()", error.message);

                        this.variableObject.isOfflineMcp.state = true;
                    });
            }
        }

        if (resultList.length > 0) {
            const index = this.variableObject.chatMessage.state.length - 1;

            this.variableObject.chatMessage.state.push({
                ...this.variableObject.chatMessage.state[index],
                time: helperSrc.localeFormat(new Date()) as string,
                file: resultList.join(", ")
            });

            this.autoscroll(false);
        }
    };

    private apiMcpLogout = async (): Promise<void | Response> => {
        return fetch(`${helperSrc.URL_MCP}/logout`, {
            method: "GET",
            headers: {
                Cookie: this.mcpCookie,
                "mcp-session-id": this.mcpSessionId
            },
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        })
            .then(() => {
                this.variableObject.isOfflineMcp.state = true;

                this.mcpCookie = "";
                this.mcpSessionId = "";
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Index.ts - apiMcpLogout() - fetch() - catch()", error.message);

                this.variableObject.isOfflineMcp.state = true;
            });
    };

    private onClickButtonUpload = (): void => {
        this.apiMcpUpload();
    };

    private onClickButtonToolCall = (): void => {
        this.variableObject.agentMode.state = this.variableObject.agentMode.state === "tool-call" ? "chat" : "tool-call";
    };

    private onClickButtonToolTask = (): void => {
        this.variableObject.agentMode.state = this.variableObject.agentMode.state === "tool-task" ? "chat" : "tool-task";
    };

    private onClickButtonMessageSend = (): void => {
        if (this.abortControllerApiAiResponse && this.responseId) {
            this.abortControllerApiAiResponse.abort();
            this.abortControllerApiAiResponse = null;
        } else {
            this.apiAiResponse();
        }
    };

    private onClickButtonModel = (): void => {
        this.apiAiModel();
    };

    private onClickModelName = (name: string): void => {
        this.variableObject.modelSelected.state = name;
    };

    private onClickRefreshPage = (): void => {
        window.location.reload();
    };

    private onClickAd = (event: Event): void => {
        event.preventDefault();

        if (helperSrc.IS_DEBUG) {
            this.variableObject.adUrl.state = "";
        } else {
            openUrl(this.variableObject.adUrl.state);
        }
    };

    constructor() {
        this.variableObject = {} as modelIndex.Ivariable;
        this.methodObject = {} as modelIndex.Imethod;

        this.responseId = "";
        this.responseReason = "";
        this.responseNoReason = "";
        this.responseMcpTool = {} as modelIndex.IapiAiResponseItem;

        this.abortControllerApiAiResponse = null;

        this.aiBearerToken = this.generateUniqueId();
        this.aiCookie = "";
        this.mcpCookie = "";
        this.mcpSessionId = "";

        this.appWindow = getCurrentWindow();
        this.appIsClosing = false;
    }

    hookObject = {} as modelIndex.IelementHook;

    variable(): void {
        this.variableObject = variableBind(
            {
                modelList: [],
                modelSelected: helperSrc.MODEL_DEFAULT,
                chatHistory: [] as modelIndex.IchatInput[],
                chatMessage: [] as modelIndex.IchatMessage[],
                isOpenDialogModelList: false,
                isOfflineAi: false,
                isOfflineMcp: false,
                adUrl: "",
                agentMode: "chat"
            },
            this.constructor.name
        );

        this.methodObject = {
            onClickButtonUpload: this.onClickButtonUpload,
            onClickButtonToolCall: this.onClickButtonToolCall,
            onClickButtonToolTask: this.onClickButtonToolTask,
            onClickButtonMessageSend: this.onClickButtonMessageSend,
            onClickButtonModel: this.onClickButtonModel,
            onClickModelName: this.onClickModelName,
            onClickRefreshPage: this.onClickRefreshPage,
            onClickAd: this.onClickAd
        };
    }

    variableEffect(watch: IvariableEffect): void {
        watch([]);
    }

    view(): IvirtualNode {
        return viewIndex(this.variableObject, this.methodObject);
    }

    event(): void {
        document.addEventListener("click", () => {
            if (this.variableObject.isOpenDialogModelList.state) {
                this.variableObject.isOpenDialogModelList.state = false;
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

        return resultList;
    }

    rendered(): void {
        (async () => {
            await this.apiAiLogin();

            await this.apiAiUserInfo();

            await this.apiMcpLogin();
        })();
    }

    destroy(): void {
        (async () => {
            await this.apiAiLogout();

            await this.apiMcpLogout();
        })();
    }
}
