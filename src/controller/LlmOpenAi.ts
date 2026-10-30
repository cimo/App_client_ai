import { fetch } from "@tauri-apps/plugin-http";

// Source
import * as session from "../Session";
import * as helperSrc from "../HelperSrc";
import * as controllerLlm from "../controller/Llm";
import * as modelHelperSrc from "../model/HelperSrc";
import * as modelLlm from "../model/Llm";
import * as modelLlmOpenAi from "../model/LlmOpenAi";
import * as modelChat from "../model/Chat";
import type Chat from "./Chat";

export default class LlmOpenAi {
    // Variable
    private intervalCliLogin: ReturnType<typeof setInterval> | undefined;
    private modelListToken: string[] = ["gpt-5.6-sol", "gpt-6-astra", "gpt-5.6-terra", "gpt-5.6-luna"];
    private modelListSubscription: string[] = ["gpt-5.6-sol", "gpt-6-astra", "gpt-5.6-terra", "gpt-5.6-luna"];
    private iterationCount = 60;

    controllerChat: Chat;

    // Method
    private apiResponseJson = async (resultApi: Response): Promise<modelHelperSrc.IapiResponse> => {
        return helperSrc.apiResponseJson(resultApi, session.deleteAiSession, "Ai session expired, login again.");
    };

    private responseError = (data: modelLlmOpenAi.IapiLlmResponse, input: modelLlm.IdataInput): void => {
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

        this.controllerChat.responseReset("finish");

        if (this.controllerChat.variableObject.isMessageSendAvailable.state) {
            this.controllerChat.messageLoadingHide(input.messageIndex);
        }
    };

    private responseComplete = async (
        noReason: string,
        input: modelLlm.IdataInput,
        apiResponse: (mode?: string, prompt?: string) => void,
        isModeContext: boolean,
        prompt?: string
    ): Promise<void> => {
        const responseCompleted = noReason;

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
                    assistantNoReason: this.controllerChat.responseNoReason.trim()
                };
            }

            messageListState[input.messageIndex] = message;

            this.controllerChat.variableObject.messageList.state = messageListState;

            this.controllerChat.messageStreamReset();

            this.controllerChat.autoscroll();
        }
    };

    private messageInitialize = (): void => {
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
    };

    private apiCheckCliLogin = (): void => {
        if (this.intervalCliLogin) {
            clearInterval(this.intervalCliLogin);
            this.intervalCliLogin = undefined;
        }

        let isIntervalRunning = false;
        let intervalCount = 0;

        this.intervalCliLogin = setInterval(async () => {
            if (isIntervalRunning) {
                return;
            }

            intervalCount++;

            isIntervalRunning = true;

            if (
                this.controllerChat.variableObject.settingLlmUsageId.state !== 2 ||
                this.controllerChat.variableObject.settingLlmServiceId.state !== 3
            ) {
                clearInterval(this.intervalCliLogin);
                this.intervalCliLogin = undefined;

                return;
            }

            this.apiFetchCliLogin(true)
                .then(async (resultApi) => {
                    this.controllerChat.variableObject.isOfflineAi.state = false;

                    const json = await this.apiResponseJson(resultApi);

                    if (json.response.state === "ok" || intervalCount >= this.iterationCount) {
                        let noReason = "";

                        if (json.response.state === "ok") {
                            noReason = typeof json.response.message !== "string" ? json.response.message.join("\n") : json.response.message;

                            this.controllerChat.variableObject.isLoginLlm.state = true;
                        } else if (intervalCount >= this.iterationCount) {
                            noReason = "Login timeout";
                        }

                        this.messageInitialize();

                        const messageIndex = this.controllerChat.variableObject.messageList.state.length - 1;
                        const messageListState = this.controllerChat.variableObject.messageList.state.slice();

                        messageListState[messageIndex] = {
                            ...messageListState[messageIndex],
                            assistantNoReason: noReason
                        };

                        this.controllerChat.variableObject.messageList.state = messageListState;

                        this.controllerChat.responseReset("finish");
                        this.controllerChat.messageStreamReset();
                        this.controllerChat.autoscroll();
                        this.controllerChat.messageLoadingHide(messageIndex);

                        clearInterval(this.intervalCliLogin);
                        this.intervalCliLogin = undefined;
                    }
                })
                .catch((error: Error) => {
                    helperSrc.writeLog("LlmOpenAi.ts - apiCheckCliLogin() - fetch() - catch()", error.message);

                    this.controllerChat.variableObject.isOfflineAi.state = true;
                });

            isIntervalRunning = false;
        }, 1000);
    };

    private apiFetchCliLogin = (isCheck?: boolean): Promise<Response> => {
        return fetch(`${helperSrc.URL_AI}/api/openai-cli`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "ai-cookie": session.data.aiCookie,
                "mcp-session-id": session.data.mcpSessionId
            },
            body: JSON.stringify({ isCheck }),
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        });
    };

    modelList = (): string[] => {
        if (this.controllerChat.variableObject.settingLlmUsageId.state === 1) {
            return this.modelListToken;
        } else {
            return this.modelListSubscription;
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

            const input = await controllerLlm.responseInitialize(this.controllerChat, mode, prompt);

            const inputList: modelLlmOpenAi.IdataInput[] = [];

            inputList.push(
                {
                    role: "system",
                    content: [
                        {
                            type: "input_text",
                            text: input.systemPrompt
                        }
                    ]
                },
                {
                    role: "user",
                    content: [{ type: "input_text", text: !prompt ? input.userPrompt : prompt }]
                }
            );

            const body: modelLlmOpenAi.IapiLlmBody = {
                stream: true,
                model: this.controllerChat.variableObject.modelSelected.state,
                input: inputList,
                tools: []
            };

            if (!(!isModeContext && input.systemModeRequest === "chat")) {
                body.temperature = 0;
            }

            const llm = this.controllerChat.selectedLlm();

            if (llm) {
                fetch(`${llm.url.replace(/\/+$/, "")}/responses`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${llm.apiKey}`
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
                            helperSrc.writeLog("LlmOpenAi.ts - apiResponse() - fetch() - Error", "Missing or invalid headers.");

                            return;
                        }

                        if (contentType.includes("application/json")) {
                            const data = (await resultApi.json()) as modelLlmOpenAi.IapiLlmResponse;

                            if (data.error) {
                                this.responseError(data, input);

                                this.controllerChat.responseReset("finish");

                                if (this.controllerChat.variableObject.isMessageSendAvailable.state) {
                                    this.controllerChat.messageLoadingHide(input.messageIndex);
                                }
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
                                            const dataTrimObject = JSON.parse(dataTrim) as modelLlmOpenAi.IapiLlmResponse;

                                            if (dataTrimObject.type === "error") {
                                                this.responseError(dataTrimObject, input);
                                            } else if (dataTrimObject.type === "response.reasoning_text.delta") {
                                                const delta = dataTrimObject.delta;

                                                if (delta) {
                                                    this.controllerChat.responseReason += delta;

                                                    this.controllerChat.hookObject.elementMessageStreamReasonWrapper.classList.remove("none");
                                                    this.controllerChat.hookObject.elementMessageStreamReason.textContent =
                                                        this.controllerChat.responseReason.trim();

                                                    if (input.systemModeRequest !== "tool-call" && input.systemModeRequest !== "task-call") {
                                                        this.controllerChat.messageLoadingHide(input.messageIndex);
                                                    }

                                                    this.controllerChat.autoscroll();
                                                }
                                            } else if (dataTrimObject.type === "response.output_text.delta") {
                                                const delta = dataTrimObject.delta;

                                                if (delta && (!prompt || isModeContext)) {
                                                    this.controllerChat.responseNoReason += delta;

                                                    if (input.systemModeRequest !== "tool-call" && input.systemModeRequest !== "task-call") {
                                                        this.controllerChat.hookObject.elementMessageStreamNoReason.classList.remove("none");
                                                        this.controllerChat.hookObject.elementMessageStreamNoReason.textContent =
                                                            this.controllerChat.responseNoReason.trim();

                                                        this.controllerChat.messageLoadingHide(input.messageIndex);
                                                    }

                                                    this.controllerChat.autoscroll();
                                                }
                                            } else if (dataTrimObject.type === "response.completed") {
                                                await this.responseComplete(
                                                    dataTrimObject.response.output[0].content[0].text,
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
                        helperSrc.writeLog("LlmOpenAi.ts - apiResponse() - fetch() - catch()", typeof error === "string" ? error : error.message);

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

    apiCliLogin = async (): Promise<void> => {
        this.messageInitialize();

        const messageIndex = this.controllerChat.variableObject.messageList.state.length - 1;
        const messageListState = this.controllerChat.variableObject.messageList.state.slice();

        this.apiFetchCliLogin()
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

                    this.apiCheckCliLogin();
                }

                this.controllerChat.variableObject.messageList.state = messageListState;

                this.controllerChat.responseReset("finish");
                this.controllerChat.messageStreamReset();
                this.controllerChat.autoscroll();
                this.controllerChat.messageLoadingHide(messageIndex);
            })
            .catch((error: Error) => {
                helperSrc.writeLog("LlmOpenAi.ts - apiCliLogin() - fetch() - catch()", error.message);

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

            const input = await controllerLlm.responseInitialize(this.controllerChat, mode, prompt);

            const body: modelLlmOpenAi.IapiCliBody = {
                model: this.controllerChat.variableObject.modelSelected.state,
                systemPrompt: input.systemPrompt,
                userPrompt: !prompt ? input.userPrompt : prompt
            };

            fetch(`${helperSrc.URL_AI}/api/openai-cli`, {
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

                        await this.responseComplete(this.controllerChat.responseNoReason, input, this.apiCliResponse, isModeContext, prompt);
                    }

                    this.controllerChat.responseReset("finish");

                    if (this.controllerChat.variableObject.isMessageSendAvailable.state) {
                        this.controllerChat.messageLoadingHide(input.messageIndex);
                    }
                })
                .catch((error: Error) => {
                    helperSrc.writeLog("LlmOpenAi.ts - apiCliResponse() - fetch() - catch()", typeof error === "string" ? error : error.message);

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
