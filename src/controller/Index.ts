import { Icontroller, IvariableEffect, IvirtualNode, variableBind } from "@cimo/jsmvcfw/dist/src/Main.js";
import { fetch } from "@tauri-apps/plugin-http";

// Source
import * as modelIndex from "../model/Index";
import viewIndex from "../view/Index";

export default class Index implements Icontroller {
    // Variable
    private variableObject: modelIndex.Ivariable;
    private methodObject: modelIndex.Imethod;

    // Method
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
        this.variableObject.modelResponseThink.state = "";
        this.variableObject.modelResponse.state = "";

        let isThinking = false;
        let pending = "";
        let visibleText = "";
        let thinkText = "";

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
                    if (pending) {
                        if (isThinking) {
                            thinkText += pending;
                        } else {
                            visibleText += pending;
                        }

                        pending = "";
                    }

                    this.variableObject.modelResponseThink.state = thinkText.trim();
                    this.variableObject.modelResponse.state = visibleText.trim();

                    break;
                }

                buffer += decoder.decode(value, { stream: true });
                const lineList = buffer.split(/\r?\n/);
                buffer = lineList.pop() || "";

                for (const line of lineList) {
                    if (line.startsWith("data:")) {
                        const data = line.slice(5).trim();

                        if (data === "[DONE]") {
                            if (pending) {
                                if (isThinking) {
                                    thinkText += pending;
                                } else {
                                    visibleText += pending;
                                }

                                pending = "";
                            }

                            this.variableObject.modelResponseThink.state = thinkText.trim();
                            this.variableObject.modelResponse.state = visibleText.trim();

                            return;
                        }

                        const dataTrim = data.trim();

                        if (dataTrim.length > 1 && dataTrim[0] === "{" && dataTrim[dataTrim.length - 1] === "}") {
                            const json = JSON.parse(dataTrim) as modelIndex.IlmStudioChatCompletion;

                            const content = json.choices[0].delta.content;

                            if (content) {
                                pending += content;

                                while (true) {
                                    const openIdx = pending.indexOf("<think>");
                                    const closeIdx = pending.indexOf("</think>");

                                    if (!isThinking) {
                                        if (openIdx === -1) {
                                            // No opening tag: all pending is visible
                                            visibleText += pending;
                                            pending = "";
                                            break;
                                        } else {
                                            // Visible part before <think>
                                            visibleText += pending.slice(0, openIdx);
                                            // Enter think
                                            pending = pending.slice(openIdx + "<think>".length);
                                            isThinking = true;
                                            // Continue loop to look for close
                                        }
                                    } else {
                                        if (closeIdx === -1) {
                                            // Inside think, no close yet: all pending goes to think
                                            thinkText += pending;
                                            pending = "";
                                            break;
                                        } else {
                                            // Inside think, close found
                                            thinkText += pending.slice(0, closeIdx);
                                            pending = pending.slice(closeIdx + "</think>".length);
                                            isThinking = false;
                                            // Continue loop: there may be more visible/think portions
                                        }
                                    }
                                }

                                this.variableObject.modelResponseThink.state = thinkText.trim();
                                this.variableObject.modelResponse.state = visibleText.trim();
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
                modelResponse: ""
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
