import { Icontroller, IvariableEffect, IvirtualNode, variableBind } from "@cimo/jsmvcfw/dist/src/Main.js";
import { fetch } from "@tauri-apps/plugin-http";
//import { invoke } from "@tauri-apps/api/core";

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
    private responseMcpTool: modelIndex.IopenAiApiResponseItem;

    private abortController: AbortController | null;

    // Method
    private resetModelResponse = (): void => {
        this.responseId = "";
        this.responseReason = "";
        this.responseNoReason = "";
        this.responseMcpTool = {} as modelIndex.IopenAiApiResponseItem;
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

    private apiLogin = (): void => {
        fetch(`${helperSrc.URL_ENDPOINT}/login`, {
            method: "GET",
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        })
            .then(async () => {
                this.variableObject.isOffline.state = false;
            })
            .catch(() => {
                this.variableObject.isOffline.state = true;
            });
    };

    private apiModel = async (): Promise<void> => {
        //const base64 = await invoke("screen_capture_take_image");

        //this.variableObject.modelSelected.state = base64 as string;

        fetch(`${helperSrc.URL_ENDPOINT}/api/v1/models`, {
            method: "GET",
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        })
            .then(async (result) => {
                this.variableObject.isOffline.state = false;

                const resultJson = (await result.json()) as modelIndex.IresponseBody;
                const jsonParse = JSON.parse(resultJson.response.stdout) as modelIndex.IopenAiApiModel[];
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
            .catch(() => {
                this.variableObject.isOffline.state = true;
            });
    };

    private apiResponse = (): void => {
        if (this.hookObject.elementInputMessageSend.value && this.variableObject.modelSelected.state !== "") {
            this.abortController = new AbortController();

            this.resetModelResponse();

            this.variableObject.chatHistory.state.push({
                role: "user",
                content: this.hookObject.elementInputMessageSend.value
            });

            this.variableObject.chatMessage.state.push({
                time: helperSrc.localeFormat(new Date()) as string,
                user: this.hookObject.elementInputMessageSend.value,
                assistantReason: this.responseReason,
                assistantNoReason: this.responseNoReason,
                mcpTool: this.responseMcpTool
            });

            this.autoscroll(false);

            const input: modelIndex.IchatHistory[] = [];

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
            }

            fetch(`${helperSrc.URL_ENDPOINT}/api/v1/responses`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: this.variableObject.modelSelected.state,
                    input,
                    temperature: 0.1,
                    max_output_tokens: 512,
                    stream: true,
                    tools: [
                        {
                            type: "mcp",
                            server_label: helperSrc.MCP_SERVER_LABEL,
                            server_url: helperSrc.MCP_SERVER_URL,
                            allowed_tools: helperSrc.MCP_SERVER_TOOL
                        }
                    ]
                }),
                signal: this.abortController.signal,
                danger: {
                    acceptInvalidCerts: true,
                    acceptInvalidHostnames: true
                }
            })
                .then(async (result) => {
                    this.variableObject.isOffline.state = false;

                    const contentType = (result.headers.get("content-type") || "").toLowerCase();

                    if (!contentType.includes("text/event-stream")) {
                        return;
                    }

                    const reader = result.body!.getReader();
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

                                if (data === "[DONE]") {
                                    this.resetModelResponse();

                                    return;
                                }

                                const dataTrim = data.trim();

                                if (dataTrim.length > 1 && dataTrim[0] === "{" && dataTrim[dataTrim.length - 1] === "}") {
                                    const json = JSON.parse(dataTrim) as modelIndex.IopenAiApiResponse;

                                    if (json.type === "error") {
                                        const content = json.error;

                                        if (content) {
                                            const idx = this.variableObject.chatMessage.state.length - 1;

                                            this.variableObject.chatMessage.state[idx] = {
                                                ...this.variableObject.chatMessage.state[idx],
                                                assistantNoReason: content.message
                                            };

                                            this.autoscroll(true);
                                        }
                                    } else if (json.type === "response.created") {
                                        const content = json.response;

                                        if (content) {
                                            this.responseId = content.id;
                                        }
                                    } else if (json.type === "response.reasoning_text.delta") {
                                        const content = json.delta;

                                        if (content) {
                                            this.responseReason += content;

                                            const index = this.variableObject.chatMessage.state.length - 1;

                                            this.variableObject.chatMessage.state[index] = {
                                                ...this.variableObject.chatMessage.state[index],
                                                assistantReason: this.responseReason.trim()
                                            };

                                            this.autoscroll(true);
                                        }
                                    } else if (json.type === "response.output_text.delta") {
                                        const content = json.delta;

                                        if (content) {
                                            this.responseNoReason += content;

                                            const index = this.variableObject.chatMessage.state.length - 1;

                                            this.variableObject.chatMessage.state[index] = {
                                                ...this.variableObject.chatMessage.state[index],
                                                assistantNoReason: this.responseNoReason.trim()
                                            };

                                            this.autoscroll(true);
                                        }
                                    } else if (json.type === "response.output_item.done") {
                                        const content = json.item;

                                        if (content && content.type === "mcp_call") {
                                            this.responseMcpTool = {
                                                name: content.name,
                                                arguments: content.arguments,
                                                output: content.output
                                            };

                                            const index = this.variableObject.chatMessage.state.length - 1;

                                            this.variableObject.chatMessage.state[index] = {
                                                ...this.variableObject.chatMessage.state[index],
                                                mcpTool: this.responseMcpTool
                                            };

                                            this.autoscroll(true);
                                        }
                                    } else if (json.type === "response.completed") {
                                        this.resetModelResponse();

                                        return;
                                    }
                                }
                            }
                        }
                    }
                })
                .catch((error: string) => {
                    if (error !== "Request cancelled") {
                        this.variableObject.isOffline.state = true;
                    }

                    this.resetModelResponse();
                });

            this.hookObject.elementInputMessageSend.value = "";
        }
    };

    private onClickButtonMessageSend = (): void => {
        if (this.abortController && this.responseId) {
            this.abortController.abort();
            this.abortController = null;
        } else {
            this.apiResponse();
        }
    };

    private onClickButtonModel = (): void => {
        this.apiModel();
    };

    private onClickModelName = (name: string): void => {
        this.variableObject.modelSelected.state = name;

        this.variableObject.chatHistory.state = [{ role: "system", content: "" }];
    };

    private onClickRefreshPage = (): void => {
        window.location.reload();
    };

    constructor() {
        this.variableObject = {} as modelIndex.Ivariable;
        this.methodObject = {} as modelIndex.Imethod;

        this.responseId = "";
        this.responseReason = "";
        this.responseNoReason = "";
        this.responseMcpTool = {} as modelIndex.IopenAiApiResponseItem;

        this.abortController = null;
    }

    hookObject = {} as modelIndex.IelementHook;

    variable(): void {
        this.variableObject = variableBind(
            {
                modelList: [],
                modelSelected: helperSrc.MODEL_DEFAULT,
                chatHistory: [{ role: "system", content: "" }],
                chatMessage: [] as modelIndex.IchatMessage[],
                isOpenDialogModelList: false,
                isOffline: false
            },
            this.constructor.name
        );

        this.methodObject = {
            onClickButtonMessageSend: this.onClickButtonMessageSend,
            onClickButtonModel: this.onClickButtonModel,
            onClickModelName: this.onClickModelName,
            onClickRefreshPage: this.onClickRefreshPage
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
    }

    subControllerList(): Icontroller[] {
        const resultList: Icontroller[] = [];

        return resultList;
    }

    rendered(): void {
        this.apiLogin();
    }

    destroy(): void {}
}
