import { Icontroller, IvariableEffect, IvirtualNode, variableBind } from "@cimo/jsmvcfw/dist/src/Main.js";
import { openUrl } from "@tauri-apps/plugin-opener";
import { fetch } from "@tauri-apps/plugin-http";

//import { getCurrentWindow, type Window, type CloseRequestedEvent } from "@tauri-apps/api/window";
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

    private uniqueId: string;

    //private appWindow: Window;

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

    private generateUniqueId = (): string => {
        const timestamp = Date.now().toString(36);
        const randomPart = crypto.getRandomValues(new Uint32Array(1))[0].toString(36);

        return `${timestamp}-${randomPart}`;
    };

    private apiLogin = (): void => {
        fetch(`${helperSrc.URL_ENDPOINT}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.uniqueId}`
            },
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        })
            .then(async (result) => {
                const resultJson = (await result.json()) as modelIndex.IresponseBody;

                if (resultJson) {
                    this.variableObject.isOffline.state = false;

                    this.variableObject.adUrl.state = resultJson.response.stdout;
                } else {
                    this.variableObject.isOffline.state = true;
                }
            })
            .catch(() => {
                this.variableObject.isOffline.state = true;
            });
    };

    private apiLogout = (): Promise<void | Response> => {
        return fetch(`${helperSrc.URL_ENDPOINT}/logout`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.uniqueId}`
            },
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        }).catch(() => {
            this.variableObject.isOffline.state = true;
        });
    };

    private apiModel = async (): Promise<void> => {
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
        //const base64 = await invoke("screen_capture_take_image");
        //this.variableObject.modelSelected.state = base64 as string;

        //await invoke("test");

        if (this.hookObject.elementInputMessageSend.value && this.variableObject.modelSelected.state !== "") {
            this.abortController = new AbortController();

            this.resetModelResponse();

            this.variableObject.chatMessage.state.push({
                time: helperSrc.localeFormat(new Date()) as string,
                user: this.hookObject.elementInputMessageSend.value,
                assistantReason: this.responseReason,
                assistantNoReason: this.responseNoReason,
                mcpTool: this.responseMcpTool
            });

            this.autoscroll(false);

            /*this.variableObject.chatHistory.state.push({
                role: "user",
                content: this.hookObject.elementInputMessageSend.value
            });*/

            const input: modelIndex.IchatInput[] = [];

            /*for (const chatHistory of this.variableObject.chatHistory.state) {
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

            input.push({
                role: "system",
                content: [
                    {
                        type: "input_text",
                        text:
                            "You are an autonomous GUI control agent that need talk only in english.\n" +
                            "Follow the user instruction end-to-end WITHOUT asking between steps.\n" +
                            "General policy:\n" +
                            " - If you will receive a request for check the GUI wait 'tool_automate_ocr' response before using the next tool.\n" +
                            " - Never guess the response for all tools. Always wait for the previous tool output before proceeding with next step.\n" +
                            " - If you need use a multi tool use it in order, wait the response and only when you have the response proceed with next toll call.\n" +
                            " - You don't need verify and confirm the result of the tool call, you need just use the response for your next step if necessary.\n" +
                            " - If you have a problem with some tool, just reply with the single word in the user response: FAIL.\n" +
                            " - If all tools will be okay, just reply with the single word in the user response: DONE."
                    }
                ]
            });

            input.push({
                role: "user",
                content: [{ type: "input_text", text: this.hookObject.elementInputMessageSend.value }]
            });

            fetch(`${helperSrc.URL_ENDPOINT}/api/v1/responses`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: this.variableObject.modelSelected.state,
                    input,
                    temperature: 0,
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
                                                tool_call_id: content.tool_call_id,
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
                .catch(() => {
                    this.variableObject.isOffline.state = true;

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
        this.responseMcpTool = {} as modelIndex.IopenAiApiResponseItem;

        this.abortController = null;

        this.uniqueId = this.generateUniqueId();

        //this.appWindow = getCurrentWindow();
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
                isOffline: false,
                adUrl: ""
            },
            this.constructor.name
        );

        this.methodObject = {
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

        /*this.appWindow.onCloseRequested(async (event: CloseRequestedEvent) => {
            event.preventDefault();

            try {
                await this.apiLogout();
            } catch (err) {
                // eslint-disable-next-line no-console
                console.log("Logout fallito:", err);
            } finally {
                // eslint-disable-next-line no-console
                console.log("Bye bye");

                await this.appWindow.close();
            }
        });*/
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
