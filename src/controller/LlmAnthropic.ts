import { fetch } from "@tauri-apps/plugin-http";

// Source
import * as session from "../Session";
import * as helperSrc from "../HelperSrc";
import * as controllerLlm from "../controller/Llm";
import * as modelHelperSrc from "../model/HelperSrc";
import * as modelLlmAnthropic from "../model/LlmAnthropic";
import * as modelChat from "../model/Chat";
import type Chat from "./Chat";

export default class LlmAnthropic {
    // Variable
    private anthropicVersion = "2023-06-01";

    modelAvailableList: string[] = ["claude-opus-5", "claude-fable-5-1", "claude-sonnet-5", "claude-haiku-4-5-20251001"];
    controllerChat: Chat;

    // Method
    private apiResponseJson = async (resultApi: Response): Promise<modelHelperSrc.IapiResponse> => {
        return helperSrc.apiResponseJson(resultApi, session.deleteAiSession, "Ai session expired, login again.");
    };

    private responseInitialize = async (mode?: string, prompt?: string): Promise<modelLlmAnthropic.IdataInput> => {
        this.controllerChat.responseReset();

        this.controllerChat.messageSentCount++;

        const systemModeRequest = this.controllerChat.variableObject.systemMode.state;

        let messageIndex = -1;

        const { resultUserPrompt: userPrompt, resultSystemPrompt: systemPrompt } = await controllerLlm.inputPrompt(this.controllerChat, prompt, mode);

        messageIndex = this.controllerChat.variableObject.messageList.state.length - 1;

        this.controllerChat.isAutoScrollEnabled = true;

        this.controllerChat.autoscroll();

        return {
            systemModeRequest,
            messageIndex,
            userPrompt,
            systemPrompt
        };
    };

    private responseComplete = async (
        noReason: string,
        input: modelLlmAnthropic.IdataInput,
        apiResponse: (mode?: string, prompt?: string) => void,
        isModeContext: boolean,
        prompt?: string
    ): Promise<void> => {
        const responseCompleted = noReason.trim();

        if (helperSrc.jsonCheck(responseCompleted) && (input.systemModeRequest === "tool-call" || input.systemModeRequest === "task-call")) {
            await controllerLlm.mcpResponse(this.controllerChat, apiResponse, responseCompleted, input.userPrompt, input.messageIndex);
        } else {
            const messageListState = this.controllerChat.variableObject.messageList.state.slice();

            let message = {
                ...messageListState[input.messageIndex],
                assistantReason: this.controllerChat.responseReason.trim()
            };

            if ((!prompt || isModeContext) && input.systemModeRequest !== "tool-call" && input.systemModeRequest !== "task-call") {
                message = {
                    ...message,
                    assistantNoReason: responseCompleted
                };
            }

            messageListState[input.messageIndex] = message;

            this.controllerChat.variableObject.messageList.state = messageListState;

            this.controllerChat.messageStreamReset();

            this.controllerChat.autoscroll();
        }
    };

    apiResponse = async (mode?: string, prompt?: string): Promise<void> => {
        //const base64 = await invoke("test_screenshot");
        //this.variableObject.modelSelected.state = base64 as string;

        //await invoke("test");

        const isModeContext = mode === "rag" || mode === "document";

        if (!this.controllerChat.variableObject.isMessageSendAvailable.state && !isModeContext) {
            this.controllerChat.controllerToast.show("warning", ["Wait for the current response to complete."]);

            return;
        }

        if (
            (prompt || this.controllerChat.hookObject.elementInputMessageSend.value) &&
            this.controllerChat.variableObject.modelSelected.state !== ""
        ) {
            this.controllerChat.abortControllerLlmResponse = new AbortController();

            const input = await this.responseInitialize(mode, prompt);

            const systemList: modelLlmAnthropic.IdataSystem[] = [];
            const messageList: modelLlmAnthropic.IdataMessage[] = [];

            systemList.push({
                type: "text",
                text: input.systemPrompt
            });

            messageList.push({
                role: "user",
                content: [{ type: "text", text: !prompt ? input.userPrompt : prompt }]
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

                                    messageListState[input.messageIndex] = {
                                        ...messageListState[input.messageIndex],
                                        assistantNoReason: error.message
                                    };

                                    this.controllerChat.variableObject.messageList.state = messageListState;

                                    this.controllerChat.messageStreamReset();

                                    this.controllerChat.autoscroll();
                                }
                            }

                            this.controllerChat.responseReset("finish");

                            if (this.controllerChat.variableObject.isMessageSendAvailable.state) {
                                this.controllerChat.messageLoadingHide(input.messageIndex);
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
                                        this.controllerChat.messageLoadingHide(input.messageIndex);
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

                                                    if (input.systemModeRequest !== "tool-call" && input.systemModeRequest !== "task-call") {
                                                        this.controllerChat.messageLoadingHide(input.messageIndex);
                                                    }

                                                    this.controllerChat.autoscroll();
                                                } else if (delta.type === "text_delta" && delta.text) {
                                                    if (!prompt || isModeContext) {
                                                        this.controllerChat.responseNoReason += delta.text;

                                                        if (input.systemModeRequest !== "tool-call" && input.systemModeRequest !== "task-call") {
                                                            this.controllerChat.hookObject.elementMessageStreamNoReason.classList.remove("none");
                                                            this.controllerChat.hookObject.elementMessageStreamNoReason.textContent =
                                                                this.controllerChat.responseNoReason.trim();

                                                            this.controllerChat.messageLoadingHide(input.messageIndex);
                                                        }

                                                        this.controllerChat.autoscroll();
                                                    }
                                                }
                                            } else if (dataTrimObject.type === "message_stop") {
                                                this.responseComplete(
                                                    this.controllerChat.responseNoReason,
                                                    input,
                                                    this.apiResponse,
                                                    isModeContext,
                                                    prompt
                                                );
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
                            this.controllerChat.messageLoadingHide(input.messageIndex);
                        }

                        if (error.toString().toLowerCase() === "request cancelled") {
                            const messageListState = this.controllerChat.variableObject.messageList.state.slice();

                            messageListState[input.messageIndex] = {
                                ...messageListState[input.messageIndex],
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

    apiCliLogin = async (code?: string): Promise<void | Response> => {
        this.controllerChat.variableObject.messageList.state = [
            ...this.controllerChat.variableObject.messageList.state,
            {
                isLoading: true,
                time: helperSrc.localeFormat(new Date()) as string,
                user: "",
                assistantReason: this.controllerChat.responseReason,
                assistantNoReason: this.controllerChat.responseNoReason,
                mcpToolBody: this.controllerChat.responseMcpTool,
                ragCitationList: undefined,
                ragCitationTabIndex: 0,
                securityScanner: "",
                documentParserList: [],
                documentParserTabIndex: 0,
                playwright: {} as modelChat.Iplaywright,
                llmAuthenticationUrl: ""
            }
        ];

        const messageIndex = this.controllerChat.variableObject.messageList.state.length - 1;
        const messageListState = this.controllerChat.variableObject.messageList.state.slice();

        return fetch(`${helperSrc.URL_AI}/api/anthropic-cli`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "ai-cookie": session.data.aiCookie,
                "mcp-session-id": session.data.mcpSessionId
            },
            body: JSON.stringify({ code }),
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        })
            .then(async (resultApi) => {
                this.controllerChat.variableObject.isOfflineAi.state = false;

                const json = await this.apiResponseJson(resultApi);

                if (json.response.state === "ko") {
                    messageListState[messageIndex] = {
                        ...messageListState[messageIndex],
                        assistantNoReason: typeof json.response.message !== "string" ? json.response.message.join("\n") : json.response.message
                    };
                } else {
                    messageListState[messageIndex] = {
                        ...messageListState[messageIndex],
                        assistantNoReason: typeof json.response.message !== "string" ? json.response.message.join("\n") : json.response.message,
                        llmAuthenticationUrl: json.response.data as string
                    };

                    if (code) {
                        this.controllerChat.variableObject.isLoginLlm.state = true;
                    }
                }

                this.controllerChat.variableObject.messageList.state = messageListState;

                this.controllerChat.responseReset("finish");
                this.controllerChat.messageStreamReset();
                this.controllerChat.autoscroll();
                this.controllerChat.messageLoadingHide(messageIndex);
            })
            .catch((error: Error) => {
                helperSrc.writeLog("LlmAnthropic.ts - apiCliLogin() - fetch() - catch()", error.message);

                this.controllerChat.variableObject.isOfflineAi.state = true;
            });
    };

    apiCliResponse = async (mode?: string, prompt?: string): Promise<void> => {
        const isModeContext = mode === "rag" || mode === "document";

        if (!this.controllerChat.variableObject.isMessageSendAvailable.state && !isModeContext) {
            this.controllerChat.controllerToast.show("warning", ["Wait for the current response to complete."]);

            return;
        }

        if (prompt || this.controllerChat.hookObject.elementInputMessageSend.value) {
            this.controllerChat.abortControllerLlmResponse = new AbortController();

            const input = await this.responseInitialize(mode, prompt);

            const body: modelLlmAnthropic.IapiCliBody = {
                model: this.controllerChat.variableObject.modelSelected.state,
                systemPrompt: input.systemPrompt,
                userPrompt: !prompt ? input.userPrompt : prompt
            };

            fetch(`${helperSrc.URL_AI}/api/anthropic-cli`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "ai-cookie": session.data.aiCookie,
                    "mcp-session-id": session.data.mcpSessionId
                },
                body: JSON.stringify(body),
                signal: this.controllerChat.abortControllerLlmResponse.signal,
                danger: {
                    acceptInvalidCerts: true,
                    acceptInvalidHostnames: true
                }
            })
                .then(async (resultApi) => {
                    const json = await this.apiResponseJson(resultApi);

                    if (json.response.state === "ko") {
                        const messageIndex = this.controllerChat.variableObject.messageList.state.length - 1;
                        const messageListState = this.controllerChat.variableObject.messageList.state.slice();

                        messageListState[messageIndex] = {
                            ...messageListState[messageIndex],
                            assistantNoReason: typeof json.response.message !== "string" ? json.response.message.join("\n") : json.response.message
                        };

                        this.controllerChat.variableObject.messageList.state = messageListState;

                        this.controllerChat.autoscroll();
                    } else {
                        this.controllerChat.responseNoReason += json.response.data as string;

                        this.responseComplete(this.controllerChat.responseNoReason, input, this.apiCliResponse, isModeContext, prompt);
                    }

                    this.controllerChat.responseReset("finish");

                    if (this.controllerChat.variableObject.isMessageSendAvailable.state) {
                        this.controllerChat.messageLoadingHide(input.messageIndex);
                    }
                })
                .catch((error: Error) => {
                    helperSrc.writeLog("LlmAnthropic.ts - apiCli() - fetch() - catch()", typeof error === "string" ? error : error.message);

                    this.controllerChat.responseReset("finish");

                    this.controllerChat.messageStreamReset();

                    if (this.controllerChat.variableObject.isMessageSendAvailable.state) {
                        this.controllerChat.messageLoadingHide(input.messageIndex);
                    }

                    if (error.toString().toLowerCase() === "request cancelled") {
                        const messageListState = this.controllerChat.variableObject.messageList.state.slice();

                        messageListState[input.messageIndex] = {
                            ...messageListState[input.messageIndex],
                            assistantNoReason: "Stopped by user."
                        };

                        this.controllerChat.variableObject.messageList.state = messageListState;

                        return;
                    }
                });

            this.controllerChat.hookObject.elementInputMessageSend.value = "";
        }
    };

    constructor(controllerChat: Chat) {
        this.controllerChat = controllerChat;
    }
}
