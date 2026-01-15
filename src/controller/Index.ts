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
        }).then(async () => {});
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
            }).then(async (result) => {
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
            });

            this.hookObject.elementInputMessageSend.value = "";
        }
    };

    private onClickButtonMessageSend = (): void => {
        this.apiChatCompletion();
    };

    private onClickButtonModelList = (): void => {
        fetch(`${helperSrc.URL_ENDPOINT}/api/v1/models`, {
            method: "GET",
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        }).then(async (result) => {
            const resultJson = (await result.json()) as modelIndex.IresponseBody;

            this.variableObject.modelList.state = JSON.parse(resultJson.response.stdout);

            this.variableObject.isOpenDialogModelList.state = !this.variableObject.isOpenDialogModelList.state;
        });
    };

    private onClickModelName = (name: string): void => {
        this.modelNameSelected = name;

        this.variableObject.isOpenDialogModelList.state = false;
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
                isOpenDialogModelList: false
            },
            this.constructor.name
        );

        this.methodObject = {
            onClickButtonMessageSend: this.onClickButtonMessageSend,
            onClickButtonModelList: this.onClickButtonModelList,
            onClickModelName: this.onClickModelName
        };
    }

    variableEffect(watch: IvariableEffect): void {
        watch([]);
    }

    view(): IvirtualNode {
        return viewIndex(this.variableObject, this.methodObject);
    }

    event(): void {}

    subControllerList(): Icontroller[] {
        const resultList: Icontroller[] = [];

        return resultList;
    }

    rendered(): void {
        this.apiLogin();
    }

    destroy(): void {}
}
