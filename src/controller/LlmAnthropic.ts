import { fetch } from "@tauri-apps/plugin-http";

// Source
import * as helperSrc from "../HelperSrc";
import * as controllerLlm from "../controller/Llm";
import * as modelLlmAnthropic from "../model/LlmAnthropic";
import type Chat from "./Chat";

export default class LlmAnthropic {
    // Variable
    private anthropicVersion = "2023-06-01";
    private modelAvailableList: string[] = ["claude-fable-5-1", "claude-opus-5", "claude-sonnet-5", "claude-haiku-4-5-20251001"];

    controllerChat: Chat;

    // Method
    apiModel = async (isShowDropdown: boolean): Promise<void> => {
        const llm = this.controllerChat.selectedLlm();

        if (llm) {
            return fetch(`${llm.url}/models`, {
                method: "GET",
                headers: {
                    "anthropic-dangerous-direct-browser-access": "true",
                    "anthropic-version": this.anthropicVersion,
                    "X-Api-Key": llm.apiKey
                },
                danger: {
                    acceptInvalidCerts: true,
                    acceptInvalidHostnames: true
                }
            })
                .then(async (resultApi) => {
                    const json = (await resultApi.json()) as modelLlmAnthropic.IapiModelBody;

                    const modelList: string[] = [];

                    for (const availableModel of this.modelAvailableList) {
                        for (const model of json.data) {
                            if (model.type === "model" && model.id === availableModel) {
                                modelList.push(model.id);

                                break;
                            }
                        }
                    }

                    controllerLlm.updateModel(this, modelList, isShowDropdown);
                })
                .catch((error: Error) => {
                    helperSrc.writeLog("LlmAnthropic.ts - apiModel() - fetch() - catch()", error.message);

                    this.controllerChat.llmServiceError();
                });
        }
    };

    apiResponse = async (mode?: string, prompt?: string): Promise<void> => {
        //const base64 = await invoke("test_screenshot");
        //this.variableObject.modelSelected.state = base64 as string;

        //await invoke("test");

        if (!this.controllerChat.variableObject.isMessageSendAvailable.state && mode !== "rag") {
            this.controllerChat.controllerToast.show("warning", ["Wait for the current response to complete."]);

            return;
        }

        if (
            (prompt || this.controllerChat.hookObject.elementInputMessageSend.value) &&
            this.controllerChat.variableObject.modelSelected.state !== ""
        ) {
            this.controllerChat.abortControllerLlmResponse = new AbortController();

            this.controllerChat.responseReset();

            this.controllerChat.messageSentCount++;

            const systemModeRequest = this.controllerChat.variableObject.systemMode.state;

            let messageIndex = -1;

            const { resultUserPrompt: userPrompt, resultSystemPrompt: systemPrompt } = await controllerLlm.inputPrompt(this, prompt, mode);

            messageIndex = this.controllerChat.variableObject.messageList.state.length - 1;

            this.controllerChat.isAutoScrollEnabled = true;

            this.controllerChat.autoscroll();

            const systemList: modelLlmAnthropic.IdataSystem[] = [];
            const messageList: modelLlmAnthropic.IdataMessage[] = [];

            // this.variableObject.historyList.state.push({
            //     role: "user",
            //     content: this.hookObject.elementInputMessageSend.value
            // });

            // for (let a = 0; a < this.variableObject.historyList.state.length; a++) {
            //     const historyList = this.variableObject.historyList.state[a];

            //     if (historyList.role === "system" || historyList.role === "user") {
            //         inputList.push({
            //             role: historyList.role,
            //             content: [{ type: "input_text", text: historyList.content as string }]
            //         });
            //     } else {
            //         inputList.push({
            //             role: historyList.role,
            //             content: [{ type: "output_text", text: historyList.content as string }]
            //         });
            //     }
            // }

            systemList.push({
                type: "text",
                text: systemPrompt
            });

            messageList.push({
                role: "user",
                content: [{ type: "text", text: !prompt ? userPrompt : prompt }]
            });

            const body: modelLlmAnthropic.IapiLlmBody = {
                max_tokens: 1024,
                stream: true,
                model: this.controllerChat.variableObject.modelSelected.state,
                system: systemList,
                messages: messageList,
                tools: []
            };

            const llm = this.controllerChat.selectedLlm();

            if (llm) {
                fetch(`${llm.url}/messages`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "anthropic-dangerous-direct-browser-access": "true",
                        "anthropic-version": this.anthropicVersion,
                        "X-Api-Key": llm.apiKey
                    },
                    body: JSON.stringify(body),
                    signal: this.controllerChat.abortControllerLlmResponse.signal,
                    danger: {
                        acceptInvalidCerts: true,
                        acceptInvalidHostnames: true
                    }
                })
                    .then(async (resultApi) => {
                        const contentType = resultApi.headers.get("Content-Type");

                        if (!contentType) {
                            helperSrc.writeLog("LlmAnthropic.ts - apiResponse() - fetch() - Error", "Missing or invalid headers.");

                            return;
                        }

                        if (contentType.includes("application/json")) {
                            const data = (await resultApi.json()) as modelLlmAnthropic.IapiLlmResponse;

                            if (data.type === "error") {
                                const error = data.error;

                                if (error) {
                                    const messageListState = this.controllerChat.variableObject.messageList.state.slice();

                                    messageListState[messageIndex] = {
                                        ...messageListState[messageIndex],
                                        assistantNoReason: error.message
                                    };

                                    this.controllerChat.variableObject.messageList.state = messageListState;

                                    this.controllerChat.messageStreamReset();

                                    this.controllerChat.autoscroll();
                                }
                            }

                            this.controllerChat.responseReset("finish");

                            if (this.controllerChat.variableObject.isMessageSendAvailable.state) {
                                this.controllerChat.messageLoadingHide(messageIndex);
                            }
                        } else if (contentType.includes("text/event-stream") && resultApi.body) {
                            const reader = resultApi.body.getReader();
                            const decoder = new TextDecoder("utf-8");
                            let buffer = "";

                            while (true) {
                                const { value, done } = await reader.read();

                                if (done) {
                                    this.controllerChat.responseReset("finish");

                                    if (this.controllerChat.variableObject.isMessageSendAvailable.state) {
                                        this.controllerChat.messageLoadingHide(messageIndex);
                                    }

                                    break;
                                }

                                buffer += decoder.decode(value, { stream: true });
                                const bufferSplit = buffer.split(/\r?\n/);
                                buffer = bufferSplit.pop() as string;

                                for (let a = 0; a < bufferSplit.length; a++) {
                                    const line = bufferSplit[a];

                                    if (line.startsWith("data:")) {
                                        const data = line.slice(5).trim();

                                        const dataTrim = data.trim();

                                        if (helperSrc.jsonCheck(dataTrim)) {
                                            const dataTrimObject = JSON.parse(dataTrim) as modelLlmAnthropic.IapiLlmResponse;

                                            if (dataTrimObject.type === "content_block_delta") {
                                                const delta = dataTrimObject.delta;

                                                if (delta.type === "thinking_delta" && delta.thinking) {
                                                    this.controllerChat.responseReason += delta.thinking;

                                                    this.controllerChat.hookObject.elementMessageStreamReasonWrapper.classList.remove("none");
                                                    this.controllerChat.hookObject.elementMessageStreamReason.textContent =
                                                        this.controllerChat.responseReason.trim();

                                                    if (systemModeRequest !== "tool-call" && systemModeRequest !== "task-call") {
                                                        this.controllerChat.messageLoadingHide(messageIndex);
                                                    }

                                                    this.controllerChat.autoscroll();
                                                } else if (delta.type === "text_delta" && delta.text) {
                                                    if (!prompt || mode === "rag") {
                                                        this.controllerChat.responseNoReason += delta.text;

                                                        if (systemModeRequest !== "tool-call" && systemModeRequest !== "task-call") {
                                                            this.controllerChat.hookObject.elementMessageStreamNoReason.classList.remove("none");
                                                            this.controllerChat.hookObject.elementMessageStreamNoReason.textContent =
                                                                this.controllerChat.responseNoReason.trim();

                                                            this.controllerChat.messageLoadingHide(messageIndex);
                                                        }

                                                        this.controllerChat.autoscroll();
                                                    }
                                                }
                                            } else if (dataTrimObject.type === "message_stop") {
                                                const responseCompleted = this.controllerChat.responseNoReason.trim();

                                                if (
                                                    helperSrc.jsonCheck(responseCompleted) &&
                                                    (systemModeRequest === "tool-call" || systemModeRequest === "task-call")
                                                ) {
                                                    await controllerLlm.mcpResponse(this, responseCompleted, userPrompt, messageIndex);
                                                } else {
                                                    const messageListState = this.controllerChat.variableObject.messageList.state.slice();

                                                    let message = {
                                                        ...messageListState[messageIndex],
                                                        assistantReason: this.controllerChat.responseReason.trim()
                                                    };

                                                    if (
                                                        (!prompt || mode === "rag") &&
                                                        systemModeRequest !== "tool-call" &&
                                                        systemModeRequest !== "task-call"
                                                    ) {
                                                        message = {
                                                            ...message,
                                                            assistantNoReason: this.controllerChat.responseNoReason.trim()
                                                        };
                                                    }

                                                    messageListState[messageIndex] = message;

                                                    this.controllerChat.variableObject.messageList.state = messageListState;

                                                    this.controllerChat.messageStreamReset();

                                                    this.controllerChat.autoscroll();
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    })
                    .catch((error: Error) => {
                        helperSrc.writeLog("LlmAnthropic.ts - apiResponse() - fetch() - catch()", typeof error === "string" ? error : error.message);

                        this.controllerChat.responseReset("finish");

                        this.controllerChat.messageStreamReset();

                        if (this.controllerChat.variableObject.isMessageSendAvailable.state) {
                            this.controllerChat.messageLoadingHide(messageIndex);
                        }

                        if (error.toString().toLowerCase() === "request cancelled") {
                            const messageListState = this.controllerChat.variableObject.messageList.state.slice();

                            messageListState[messageIndex] = {
                                ...messageListState[messageIndex],
                                assistantNoReason: "Stopped by user."
                            };

                            this.controllerChat.variableObject.messageList.state = messageListState;

                            return;
                        }
                    });
            }

            this.controllerChat.hookObject.elementInputMessageSend.value = "";
        }
    };

    constructor(controllerChat: Chat) {
        this.controllerChat = controllerChat;
    }
}
