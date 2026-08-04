import { fetch } from "@tauri-apps/plugin-http";

// Source
import * as session from "../Session";
import * as helperSrc from "../HelperSrc";
import * as controllerLlm from "../controller/Llm";
import * as modelLlmLlamaCpp from "../model/LlmLlamaCpp";
import type Chat from "./Chat";

export default class LlmLlamaCpp {
    // Variable
    controllerChat: Chat;

    // Method
    apiModel = async (isShowDropdown: boolean): Promise<void> => {
        const llm = this.controllerChat.selectedLlm();

        if (llm) {
            return fetch(`${llm.url}/api/model`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${llm.apiKey ? llm.apiKey : session.data.aiBearerToken}`,
                    "ai-cookie": session.data.aiCookie
                },
                danger: {
                    acceptInvalidCerts: true,
                    acceptInvalidHostnames: true
                }
            })
                .then(async (resultApi) => {
                    const json = (await resultApi.json()) as modelLlmLlamaCpp.IapiModelBody;
                    const stdoutList = JSON.parse(json.response.stdout);

                    controllerLlm.updateModel(this, stdoutList, isShowDropdown);
                })
                .catch((error: Error) => {
                    helperSrc.writeLog("LlmLlamaCpp.ts - apiModel() - fetch() - catch()", error.message);

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

            const inputList: modelLlmLlamaCpp.IdataInput[] = [];

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

            inputList.push(
                {
                    role: "system",
                    content: [
                        {
                            type: "input_text",
                            text: systemPrompt
                        }
                    ]
                },
                {
                    role: "user",
                    content: [{ type: "input_text", text: !prompt ? userPrompt : prompt }]
                }
            );

            const body: modelLlmLlamaCpp.IapiLlmBody = {
                stream: true,
                model: this.controllerChat.variableObject.modelSelected.state,
                input: inputList,
                tools: []
            };

            if (!(mode !== "rag" && systemModeRequest === "chat")) {
                body.temperature = 0;
            }

            const llm = this.controllerChat.selectedLlm();

            if (llm) {
                fetch(`${llm.url}/api/response`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${llm.apiKey ? llm.apiKey : session.data.aiBearerToken}`,
                        "ai-cookie": session.data.aiCookie,
                        "mcp-session-id": session.data.mcpSessionId,
                        "mcp-cookie": session.data.mcpCookie
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

                        if (!contentType || !contentType.includes("text/event-stream") || !resultApi.body) {
                            helperSrc.writeLog("LlmLlamaCpp.ts - apiResponse() - fetch() - Error", "Missing or invalid headers.");

                            return;
                        }

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
                                        const dataTrimObject = JSON.parse(dataTrim) as modelLlmLlamaCpp.IapiLlmResponse;

                                        if (dataTrimObject.type === "error") {
                                            const error = dataTrimObject.error;

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
                                        } else if (dataTrimObject.type === "response.reasoning_text.delta") {
                                            const delta = dataTrimObject.delta;

                                            if (delta) {
                                                this.controllerChat.responseReason += delta;

                                                this.controllerChat.hookObject.elementMessageStreamReasonWrapper.classList.remove("none");
                                                this.controllerChat.hookObject.elementMessageStreamReason.textContent =
                                                    this.controllerChat.responseReason.trim();

                                                if (systemModeRequest !== "tool-call" && systemModeRequest !== "task-call") {
                                                    this.controllerChat.messageLoadingHide(messageIndex);
                                                }

                                                this.controllerChat.autoscroll();
                                            }
                                        } else if (dataTrimObject.type === "response.output_text.delta") {
                                            const delta = dataTrimObject.delta;

                                            if (delta && (!prompt || mode === "rag")) {
                                                this.controllerChat.responseNoReason += delta;

                                                if (systemModeRequest !== "tool-call" && systemModeRequest !== "task-call") {
                                                    this.controllerChat.hookObject.elementMessageStreamNoReason.classList.remove("none");
                                                    this.controllerChat.hookObject.elementMessageStreamNoReason.textContent =
                                                        this.controllerChat.responseNoReason.trim();

                                                    this.controllerChat.messageLoadingHide(messageIndex);
                                                }

                                                this.controllerChat.autoscroll();
                                            }
                                        } else if (dataTrimObject.type === "response.output_item.done") {
                                            const item = dataTrimObject.item;

                                            if (item && item.type === "mcp_call" && (!prompt || mode === "rag")) {
                                                this.controllerChat.responseMcpTool = {
                                                    tool_call_id: item.tool_call_id,
                                                    type: item.type,
                                                    name: item.name,
                                                    arguments: item.arguments,
                                                    output: item.output
                                                };

                                                const messageListState = this.controllerChat.variableObject.messageList.state.slice();

                                                messageListState[messageIndex] = {
                                                    ...messageListState[messageIndex],
                                                    mcpToolBody: this.controllerChat.responseMcpTool
                                                };

                                                this.controllerChat.variableObject.messageList.state = messageListState;

                                                this.controllerChat.messageLoadingHide(messageIndex);

                                                this.controllerChat.autoscroll();
                                            }
                                        } else if (dataTrimObject.type === "response.completed") {
                                            const response = dataTrimObject.response;

                                            if (response) {
                                                const responseCompleted = response.output[0].content[0].text;

                                                if (
                                                    helperSrc.jsonCheck(responseCompleted) &&
                                                    (systemModeRequest === "tool-call" || systemModeRequest === "task-call")
                                                ) {
                                                    await controllerLlm.mcpJsonResponse(this, responseCompleted, userPrompt, messageIndex);
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
                        helperSrc.writeLog("LlmLlamaCpp.ts - apiResponse() - fetch() - catch()", typeof error === "string" ? error : error.message);

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
