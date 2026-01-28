import { Icontroller, IvariableEffect, IvirtualNode, variableBind } from "@cimo/jsmvcfw/dist/src/Main.js";
import { openUrl } from "@tauri-apps/plugin-opener";
import { fetch } from "@tauri-apps/plugin-http";
//import { invoke } from "@tauri-apps/api/core";

// Source
import * as helperSrc from "../HelperSrc";
import * as modelIndex from "../model/Index";
import viewIndex from "../view/Index";

const autoTool = new Set(["tool_ocr", "tool_automate_mouse_move", "tool_automate_mouse_click"]);

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

    private toolAutoCall = async (previousResponseId: string, toolCallId: string, toolOutput: string) => {
        await fetch(`${helperSrc.URL_ENDPOINT}/api/v1/responses`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },

            body: JSON.stringify({
                model: this.variableObject.modelSelected.state,
                input: "",
                temperature: 0,
                previous_response_id: previousResponseId,
                tool_outputs: [
                    {
                        tool_call_id: toolCallId,
                        output: toolOutput
                    }
                ]
            }),
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
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

    private apiModel = async (): Promise<void> => {
        //const base64 = await invoke("screen_capture_take_image");
        //this.variableObject.modelSelected.state = base64 as string;

        //await invoke("test");

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

            const input: modelIndex.IchatHistory[] = [];

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
                            "You are an autonomous Windows GUI control agent.\n" +
                            "Goal: follow the user's instruction end-to-end WITHOUT asking between steps.\n" +
                            "General policy:\n" +
                            " - Use OCR to locate on-screen targets.\n" +
                            " - Open apps using keyboard when needed.\n" +
                            " - Move the mouse to the target region and click when needed.\n" +
                            " - Use multiple tool calls as needed, until the task is complete.\n" +
                            " - Do not ask for confirmation. When the goal is achieved, reply with the single word: DONE."
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

                                            // eslint-disable-next-line no-console
                                            console.log("cimo1", content.name);

                                            if (autoTool.has(content.name)) {
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                const toolCallId = (content as any).tool_call_id || (content as any).id;

                                                if (this.responseId && toolCallId) {
                                                    // eslint-disable-next-line no-console
                                                    console.log("cimo2", this.responseId, toolCallId, content.output);

                                                    //await this.toolAutoCall(this.responseId, toolCallId, content.output);
                                                }
                                            }
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
    }

    hookObject = {} as modelIndex.IelementHook;

    variable(): void {
        this.variableObject = variableBind(
            {
                modelList: [],
                modelSelected: helperSrc.MODEL_DEFAULT,
                chatHistory: [
                    {
                        role: "system",
                        content:
                            "You are an autonomous Windows GUI Control Agent.\n" +
                            "Goal: follow the user's instruction end-to-end WITHOUT asking between steps.\n" +
                            "General policy:\n" +
                            " - Open apps using keyboard (Win key, type app name, Enter) when needed.\n" +
                            " - Use OCR to locate on-screen targets when text labels are mentioned (e.g., 'Login').\n" +
                            " - Move the mouse to the target region and click.\n" +
                            " - Use multiple tool calls as needed, until the task is complete.\n" +
                            " - Do not ask for confirmation. When the goal is achieved, reply with the single word: DONE."
                    }
                ],
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
