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

    // Method
    private dataDone = (contentPending: string, isThinking: boolean, responseThink: string, responseNoThink: string): void => {
        if (contentPending) {
            if (isThinking) {
                responseThink += contentPending;
            } else {
                responseNoThink += contentPending;
            }

            contentPending = "";
        }

        this.variableObject.modelResponseThink.state = responseThink.trim();
        this.variableObject.modelResponseNoThink.state = responseNoThink.trim();
    };

    private apiLogin = (): void => {
        fetch("https://172.20.0.1:1046/login", {
            method: "GET",
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        }).then(async () => {});
    };

    private apiModel = (): void => {
        fetch("https://172.20.0.1:1046/api/v1/models", {
            method: "GET",
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        }).then(async (result) => {
            const resultJson = (await result.json()) as modelIndex.IresponseBody;

            this.variableObject.modelList.state = JSON.parse(resultJson.response.stdout);
        });
    };

    private apiChatCompletions = (): void => {
        this.variableObject.messageSendCopy.state = this.hookObject.elementInputMessageSend.value;
        this.variableObject.messageSendCopyTime.state = helperSrc.localeFormat(new Date()) as string;

        this.variableObject.modelResponseThink.state = "";
        this.variableObject.modelResponseNoThink.state = "";

        let isThinking = false;
        let contentPending = "";
        let responseThink = "";
        let responseNoThink = "";

        fetch("https://172.20.0.1:1046/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "qwen3-1.7b",
                messages: [
                    { role: "system", content: "" },
                    //{ role: "system", content: "/no_think" },
                    { role: "user", content: this.hookObject.elementInputMessageSend.value }
                ],
                temperature: 0,
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

                                this.variableObject.modelResponseThink.state = responseThink.trim();
                                this.variableObject.modelResponseNoThink.state = responseNoThink.trim();
                            }
                        }
                    }
                }
            }
        });
    };

    private onClickButtonMessageSend = (): void => {
        this.apiChatCompletions();
    };

    constructor() {
        this.variableObject = {} as modelIndex.Ivariable;
        this.methodObject = {} as modelIndex.Imethod;
    }

    hookObject = {} as modelIndex.IelementHook;

    variable(): void {
        this.variableObject = variableBind(
            {
                modelList: [],
                modelResponseThink: "",
                modelResponseNoThink: "",
                messageSendCopy: "",
                messageSendCopyTime: ""
            },
            this.constructor.name
        );

        this.methodObject = {
            onClickButtonMessageSend: this.onClickButtonMessageSend
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
