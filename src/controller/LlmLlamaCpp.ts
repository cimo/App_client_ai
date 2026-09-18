import { fetch } from "@tauri-apps/plugin-http";

// Source
import * as session from "../Session";
import * as helperSrc from "../HelperSrc";
import * as controllerLlm from "../controller/Llm";
import * as modelMcp from "../model/Mcp";
import * as modelLlm from "../model/Llm";
import * as modelLlmLlamaCpp from "../model/LlmLlamaCpp";
import type Chat from "./Chat";

export default class LlmLlamaCpp {
    // Variable
    controllerChat: Chat;

    private tokenReserve = 1536;

    // Method
    private apiFetchSession = async (
        llm: modelMcp.IsettingLlm,
        route: string,
        method: string,
        body?: string,
        signal?: AbortSignal
    ): Promise<Response> => {
        const apiFetch = (): Promise<Response> => {
            let header: HeadersInit | undefined = {
                "ai-cookie": session.data.aiCookie
            };

            if (llm.apiKey) {
                header = {
                    ...header,
                    Authorization: `Bearer ${llm.apiKey}`
                };
            }

            if (body) {
                header = {
                    ...header,
                    "Content-Type": "application/json"
                };
            }

            return fetch(`${llm.url}${route}`, {
                method,
                headers: header,
                body,
                signal,
                danger: {
                    acceptInvalidCerts: true,
                    acceptInvalidHostnames: true
                }
            });
        };

        let resultApi = await apiFetch();

        if (resultApi.status === 401) {
            session.deleteAiSession();

            await this.controllerChat.controllerAi.apiLogin();

            resultApi = await apiFetch();
        }

        return resultApi;
    };

    apiModel = async (isShowDropdown: boolean): Promise<void> => {
        const llm = this.controllerChat.selectedLlm();

        if (llm) {
            return this.apiFetchSession(llm, "/api/model", "GET")
                .then(async (resultApi) => {
                    const json = await this.controllerChat.controllerAi.apiResponseJson(resultApi);

                    if (json.response.state === "ko") {
                        this.controllerChat.controllerMcp.showToastMessage("error", json.response.message);
                    } else {
                        controllerLlm.updateModel(this, json.response.data as string[], isShowDropdown);
                    }
                })
                .catch((error: Error) => {
                    helperSrc.writeLog("LlmLlamaCpp.ts - apiModel() - fetch() - catch()", error.message);

                    this.controllerChat.llmServiceError();
                });
        }
    };

    private apiTokenDetail = async (text: string): Promise<modelLlmLlamaCpp.IdataTokenDetail> => {
        const llm = this.controllerChat.selectedLlm();

        if (!llm) {
            return { count: -1, contextSize: -1 };
        }

        const body: modelLlmLlamaCpp.IapiTokenDetailBody = {
            model: this.controllerChat.variableObject.modelSelected.state,
            text
        };

        return this.apiFetchSession(llm, "/api/token-detail", "POST", JSON.stringify(body))
            .then(async (resultApi) => {
                const json = await this.controllerChat.controllerAi.apiResponseJson(resultApi);

                if (json.response.state === "ko") {
                    helperSrc.writeLog("LlmLlamaCpp.ts - apiTokenDetail() - fetch()", json.response.message as string);

                    return { count: -1, contextSize: -1 };
                }

                return json.response.data as modelLlmLlamaCpp.IdataTokenDetail;
            })
            .catch((error: Error) => {
                helperSrc.writeLog("LlmLlamaCpp.ts - apiTokenDetail() - fetch() - catch()", error.message);

                return { count: -1, contextSize: -1 };
            });
    };

    private apiResponseText = async (systemPrompt: string, userPrompt: string): Promise<modelLlmLlamaCpp.IdataResponseText> => {
        const llm = this.controllerChat.selectedLlm();

        if (!llm) {
            return { text: "", message: "" };
        }

        const body: modelLlmLlamaCpp.IapiLlmBody = {
            stream: true,
            model: this.controllerChat.variableObject.modelSelected.state,
            input: [
                {
                    role: "system",
                    content: [{ type: "input_text", text: systemPrompt }]
                },
                {
                    role: "user",
                    content: [{ type: "input_text", text: userPrompt }]
                }
            ],
            tools: [],
            temperature: 0
        };

        const signal = this.controllerChat.abortControllerLlmResponse ? this.controllerChat.abortControllerLlmResponse.signal : undefined;

        return this.apiFetchSession(llm, "/api/response", "POST", JSON.stringify(body), signal)
            .then(async (resultApi) => {
                const contentType = resultApi.headers.get("Content-Type");

                if (!contentType || !contentType.includes("text/event-stream") || !resultApi.body) {
                    const json = await this.controllerChat.controllerAi.apiResponseJson(resultApi);

                    return { text: "", message: json.response.message as string };
                }

                const reader = resultApi.body.getReader();
                const decoder = new TextDecoder("utf-8");

                let text = "";
                let message = "";
                let buffer = "";

                while (true) {
                    const { value, done } = await reader.read();

                    if (done) {
                        break;
                    }

                    buffer += decoder.decode(value, { stream: true });
                    const bufferSplit = buffer.split(/\r?\n/);
                    buffer = bufferSplit.pop() as string;

                    for (let a = 0; a < bufferSplit.length; a++) {
                        const line = bufferSplit[a];

                        if (line.startsWith("data:")) {
                            const dataTrim = line.slice(5).trim();

                            if (helperSrc.jsonCheck(dataTrim)) {
                                const dataTrimObject = JSON.parse(dataTrim) as modelLlmLlamaCpp.IapiLlmResponse;

                                if (dataTrimObject.type === "error" && dataTrimObject.error) {
                                    message = dataTrimObject.error.message;
                                } else if (dataTrimObject.type === "response.output_text.delta" && dataTrimObject.delta) {
                                    text += dataTrimObject.delta;
                                }
                            }
                        }
                    }
                }

                return { text: text.trim(), message };
            })
            .catch((error: Error) => {
                helperSrc.writeLog("LlmLlamaCpp.ts - apiResponseText() - fetch() - catch()", error.message);

                return { text: "", message: error.message };
            });
    };

    private messageWrite = (text: string, messageIndex: number): void => {
        const messageListState = this.controllerChat.variableObject.messageList.state.slice();

        messageListState[messageIndex] = {
            ...messageListState[messageIndex],
            assistantNoReason: text
        };

        this.controllerChat.variableObject.messageList.state = messageListState;
    };

    apiResponseDocument = async (documentObject: modelLlm.IdataDocument): Promise<void> => {
        const tokenDetail = await this.apiTokenDetail(documentObject.markdown);

        if (tokenDetail.count === -1) {
            this.messageWrite("Engine not available.", documentObject.messageIndex);

            return;
        }

        const tokenBudget = tokenDetail.contextSize - this.tokenReserve;

        if (tokenDetail.count <= tokenBudget) {
            this.apiResponse("document", `DOCUMENT:\n${documentObject.markdown}\n\nText:\n${documentObject.userPrompt}`);

            return;
        }

        this.controllerChat.abortControllerLlmResponse = new AbortController();

        const systemPrompt = [
            "You are a multilingual document extractor.",
            "From the DOCUMENT you MUST extract ONLY the parts that answer the request, copied exactly as they are written.",
            "You MUST write ONLY the extracted parts, one per line, without commentary, without titles and without explanations.",
            "If the DOCUMENT does NOT contain anything that answers the request you MUST write ONLY the word NONE, nothing else.",
            "You MUST NOT write that the information is missing, you MUST NOT apologize and you MUST NOT explain: in that case the only allowed answer is NONE."
        ].join("\n");

        let content = documentObject.markdown;
        let lengthPerToken = documentObject.markdown.length / tokenDetail.count;

        while (true) {
            const chunkList = helperSrc.markdownChunkList(content, Math.floor(tokenBudget * lengthPerToken));

            const extractList: string[] = [];

            for (let a = 0; a < chunkList.length; a++) {
                this.messageWrite(`Reading ${a + 1} of ${chunkList.length}.`, documentObject.messageIndex);

                const resultText = await this.apiResponseText(systemPrompt, `DOCUMENT:\n${chunkList[a]}\n\nText:\n${documentObject.userPrompt}`);

                if (resultText.message !== "") {
                    this.messageWrite(resultText.message, documentObject.messageIndex);

                    return;
                }

                const textExtract = resultText.text.replace(/\.$/, "");

                if (textExtract !== "" && textExtract.toUpperCase() !== "NONE") {
                    extractList.push(resultText.text);
                }
            }

            const contentExtract = extractList.join("\n");

            await this.controllerChat.controllerMcp.apiWorkspaceParse(documentObject.fileName, contentExtract);

            const tokenDetailExtract = await this.apiTokenDetail(contentExtract);

            if (tokenDetailExtract.count === -1) {
                this.messageWrite("Engine not available.", documentObject.messageIndex);

                return;
            }

            const isReduced = contentExtract.length < content.length;

            content = contentExtract;
            lengthPerToken = contentExtract.length / tokenDetailExtract.count;

            if (tokenDetailExtract.count <= tokenBudget || !isReduced) {
                break;
            }
        }

        this.messageWrite("", documentObject.messageIndex);

        this.apiResponse("document", `DOCUMENT:\n${content}\n\nText:\n${documentObject.userPrompt}`);
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

            this.controllerChat.responseReset();

            this.controllerChat.messageSentCount++;

            const systemModeRequest = this.controllerChat.variableObject.systemMode.state;

            let messageIndex = -1;

            const { resultUserPrompt: userPrompt, resultSystemPrompt: systemPrompt } = await controllerLlm.inputPrompt(this, prompt, mode);

            messageIndex = this.controllerChat.variableObject.messageList.state.length - 1;

            this.controllerChat.isAutoScrollEnabled = true;

            this.controllerChat.autoscroll();

            const inputList: modelLlmLlamaCpp.IdataInput[] = [];

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

            if (!(!isModeContext && systemModeRequest === "chat")) {
                body.temperature = 0;
            }

            const llm = this.controllerChat.selectedLlm();

            if (llm) {
                this.apiFetchSession(llm, "/api/response", "POST", JSON.stringify(body), this.controllerChat.abortControllerLlmResponse.signal)
                    .then(async (resultApi) => {
                        const contentType = resultApi.headers.get("Content-Type");

                        if (!contentType || !contentType.includes("text/event-stream") || !resultApi.body) {
                            helperSrc.writeLog("LlmLlamaCpp.ts - apiResponse() - fetch() - Error", "Missing or invalid headers.");

                            const json = await this.controllerChat.controllerAi.apiResponseJson(resultApi);

                            this.controllerChat.controllerMcp.showToastMessage("error", json.response.message);

                            this.controllerChat.responseReset("finish");

                            this.controllerChat.messageStreamReset();

                            this.controllerChat.messageLoadingHide(messageIndex);

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

                                            if (delta && (!prompt || isModeContext)) {
                                                this.controllerChat.responseNoReason += delta;

                                                if (systemModeRequest !== "tool-call" && systemModeRequest !== "task-call") {
                                                    this.controllerChat.hookObject.elementMessageStreamNoReason.classList.remove("none");
                                                    this.controllerChat.hookObject.elementMessageStreamNoReason.textContent =
                                                        this.controllerChat.responseNoReason.trim();

                                                    this.controllerChat.messageLoadingHide(messageIndex);
                                                }

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
                                                    await controllerLlm.mcpResponse(this, responseCompleted, userPrompt, messageIndex);
                                                } else {
                                                    const messageListState = this.controllerChat.variableObject.messageList.state.slice();

                                                    let message = {
                                                        ...messageListState[messageIndex],
                                                        assistantReason: this.controllerChat.responseReason.trim()
                                                    };

                                                    if (
                                                        (!prompt || isModeContext) &&
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
