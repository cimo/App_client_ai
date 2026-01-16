import { Icontroller, IvariableEffect, IvirtualNode, variableBind } from "@cimo/jsmvcfw/dist/src/Main.js";
import { fetch } from "@tauri-apps/plugin-http";

// Source
import * as helperSrc from "../HelperSrc";
import * as modelIndex from "../model/Index";
import viewIndex from "../view/Index";

export default class Index implements Icontroller {
    // Variable
    private variableObject: modelIndex.Ivariable;
    private methodObject: modelIndex.Imethod;
    private modelNameSelected: string;

    // Method
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

    private dataDone = (contentPending: string, isThinking: boolean, responseThink: string, responseNoThink: string): void => {
        if (contentPending) {
            if (isThinking) {
                responseThink += contentPending;
            } else {
                responseNoThink += contentPending;
            }

            contentPending = "";
        }

        this.variableObject.chatHistory.state.push({
            role: "assistant",
            content: responseNoThink.trim()
        });

        const index = this.variableObject.chatMessage.state.length - 1;

        this.variableObject.chatMessage.state[index] = {
            ...this.variableObject.chatMessage.state[index],
            assistantThink: responseThink.trim(),
            assistantNoThink: responseNoThink.trim()
        };
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

    private apiChatCompletion = (): void => {
        if (this.hookObject.elementInputMessageSend.value && this.modelNameSelected !== "") {
            this.variableObject.chatHistory.state.push({
                role: "user",
                content: this.hookObject.elementInputMessageSend.value
            });

            this.variableObject.chatMessage.state.push({
                time: helperSrc.localeFormat(new Date()) as string,
                user: this.hookObject.elementInputMessageSend.value,
                assistantThink: "",
                assistantNoThink: ""
            });

            this.autoscroll(false);

            let isThinking = false;
            let contentPending = "";
            let responseThink = "";
            let responseNoThink = "";

            fetch(`${helperSrc.URL_ENDPOINT}/api/v1/chat/completions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: this.modelNameSelected,
                    messages: this.variableObject.chatHistory.state,
                    temperature: 0.1,
                    max_tokens: 512,
                    stream: true
                }),
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
                            this.dataDone(contentPending, isThinking, responseThink, responseNoThink);

                            break;
                        }

                        buffer += decoder.decode(value, { stream: true });
                        const lineList = buffer.split(/\r?\n/);
                        buffer = lineList.pop() || "";

                        for (const line of lineList) {
                            if (line.startsWith("data:")) {
                                const data = line.slice(5).trim();

                                if (data === "[DONE]") {
                                    this.dataDone(contentPending, isThinking, responseThink, responseNoThink);

                                    return;
                                }

                                const dataTrim = data.trim();

                                if (dataTrim.length > 1 && dataTrim[0] === "{" && dataTrim[dataTrim.length - 1] === "}") {
                                    const json = JSON.parse(dataTrim) as modelIndex.IlmStudioChatCompletion;

                                    const content = json.choices[0].delta.content;

                                    if (content) {
                                        contentPending += content;

                                        while (true) {
                                            const thinkTagOpen = contentPending.indexOf("<think>");
                                            const thinkTagClose = contentPending.indexOf("</think>");

                                            if (!isThinking) {
                                                if (thinkTagOpen === -1) {
                                                    responseNoThink += contentPending;

                                                    contentPending = "";

                                                    break;
                                                } else {
                                                    responseNoThink += contentPending.slice(0, thinkTagOpen);

                                                    contentPending = contentPending.slice(thinkTagOpen + "<think>".length);

                                                    isThinking = true;
                                                }
                                            } else {
                                                if (thinkTagClose === -1) {
                                                    responseThink += contentPending;

                                                    contentPending = "";

                                                    break;
                                                } else {
                                                    responseThink += contentPending.slice(0, thinkTagClose);

                                                    contentPending = contentPending.slice(thinkTagClose + "</think>".length);

                                                    isThinking = false;
                                                }
                                            }
                                        }

                                        const index = this.variableObject.chatMessage.state.length - 1;

                                        this.variableObject.chatMessage.state[index] = {
                                            ...this.variableObject.chatMessage.state[index],
                                            assistantThink: responseThink.trim(),
                                            assistantNoThink: responseNoThink.trim()
                                        };

                                        this.autoscroll(true);
                                    }
                                }
                            }
                        }
                    }
                })
                .catch(() => {
                    this.variableObject.isOffline.state = true;
                });

            this.hookObject.elementInputMessageSend.value = "";
        }
    };

    private apiResponse = (): void => {
        if (this.hookObject.elementInputMessageSend.value && this.modelNameSelected !== "") {
            this.variableObject.chatHistory.state.push({
                role: "user",
                content: this.hookObject.elementInputMessageSend.value
            });

            this.variableObject.chatMessage.state.push({
                time: helperSrc.localeFormat(new Date()) as string,
                user: this.hookObject.elementInputMessageSend.value,
                assistantThink: "",
                assistantNoThink: "",
                mcpTool: {} as modelIndex.IlmStudioResponseItem
            });

            this.autoscroll(false);

            let responseThink = "";
            let responseNoThink = "";
            let responseMcpTool = {} as modelIndex.IlmStudioResponseItem;

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
                    model: this.modelNameSelected,
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
                            break;
                        }

                        buffer += decoder.decode(value, { stream: true });
                        const lineList = buffer.split(/\r?\n/);
                        buffer = lineList.pop() || "";

                        for (const line of lineList) {
                            if (line.startsWith("data:")) {
                                const data = line.slice(5).trim();

                                if (data === "[DONE]") {
                                    return;
                                }

                                const dataTrim = data.trim();

                                if (dataTrim.length > 1 && dataTrim[0] === "{" && dataTrim[dataTrim.length - 1] === "}") {
                                    const json = JSON.parse(dataTrim) as modelIndex.IlmStudioResponse;

                                    if (json.type === "response.reasoning_text.delta") {
                                        const content = json.delta as string;

                                        if (content) {
                                            responseThink += content;

                                            const index = this.variableObject.chatMessage.state.length - 1;

                                            this.variableObject.chatMessage.state[index] = {
                                                ...this.variableObject.chatMessage.state[index],
                                                assistantThink: responseThink.trim()
                                            };

                                            this.autoscroll(true);
                                        }
                                    }

                                    if (json.type === "response.output_text.delta") {
                                        const content = json.delta as string;

                                        if (content) {
                                            responseNoThink += content;

                                            const index = this.variableObject.chatMessage.state.length - 1;

                                            this.variableObject.chatMessage.state[index] = {
                                                ...this.variableObject.chatMessage.state[index],
                                                assistantNoThink: responseNoThink.trim()
                                            };

                                            this.autoscroll(true);
                                        }
                                    }

                                    if (json.type === "response.output_item.done") {
                                        const item = json.item;

                                        if (item && item.type === "mcp_call") {
                                            responseMcpTool = {
                                                name: item.name,
                                                arguments: item.arguments,
                                                output: item.output
                                            };

                                            const index = this.variableObject.chatMessage.state.length - 1;

                                            this.variableObject.chatMessage.state[index] = {
                                                ...this.variableObject.chatMessage.state[index],
                                                mcpTool: responseMcpTool
                                            };

                                            this.autoscroll(true);
                                        }
                                    }

                                    if (json.type === "response.completed") {
                                        return;
                                    }
                                }
                            }
                        }
                    }
                })
                .catch(() => {
                    this.variableObject.isOffline.state = true;
                });

            this.hookObject.elementInputMessageSend.value = "";
        }
    };

    private apiModelList = (): void => {
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
                const jsonParse = JSON.parse(resultJson.response.stdout) as modelIndex.IlmStudioModel[];
                const resultCleaned = [];

                for (const value of jsonParse) {
                    if (value.id.toLowerCase().includes("embedding")) {
                        continue;
                    }

                    resultCleaned.push(value);
                }

                this.variableObject.modelList.state = resultCleaned;

                this.variableObject.isOpenDialogModelList.state = !this.variableObject.isOpenDialogModelList.state;
            })
            .catch(() => {
                this.variableObject.isOffline.state = true;
            });
    };

    private onClickButtonMessageSend = (): void => {
        //this.apiChatCompletion();
        this.apiResponse();
    };

    private onClickButtonModelList = (): void => {
        this.apiModelList();
    };

    private onClickModelName = (name: string): void => {
        this.modelNameSelected = name;

        this.variableObject.chatHistory.state = [{ role: "system", content: "" }];
    };

    private onClickRefreshPage = (): void => {
        window.location.reload();
    };

    constructor() {
        this.variableObject = {} as modelIndex.Ivariable;
        this.methodObject = {} as modelIndex.Imethod;
        this.modelNameSelected = "qwen3-1.7b";
    }

    hookObject = {} as modelIndex.IelementHook;

    variable(): void {
        this.variableObject = variableBind(
            {
                modelList: [],
                chatHistory: [{ role: "system", content: "" }],
                chatMessage: [] as modelIndex.IchatMessage[],
                isOpenDialogModelList: false,
                isOffline: false
            },
            this.constructor.name
        );

        this.methodObject = {
            onClickButtonMessageSend: this.onClickButtonMessageSend,
            onClickButtonModelList: this.onClickButtonModelList,
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
