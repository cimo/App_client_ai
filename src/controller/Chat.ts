import { Icontroller, IvirtualNode, variableBind, variableLink, IvariableEffect } from "@cimo/jsmvcfw/dist/src/Main.js";
import { fetch } from "@tauri-apps/plugin-http";
import { listen, emitTo, UnlistenFn } from "@tauri-apps/api/event";
import { getAllWindows } from "@tauri-apps/api/window";

// Source
import * as session from "../Session";
import * as helperSrc from "../HelperSrc";
import * as modelChat from "../model/Chat";
import * as modelMcp from "../model/Mcp";
import * as modelDocument from "../model/Document";
import * as viewChat from "../view/Chat";
import type Mcp from "./Mcp";
import type Toast from "./Toast";

export default class Chat implements Icontroller {
    // Variable
    private variableObject: modelChat.Ivariable;
    private methodObject: modelChat.Imethod;
    private controllerMcp: Mcp;
    private controllerToast: Toast;

    private responseId: string;
    private responseReason: string;
    private responseNoReason: string;
    private responseMcpTool: modelChat.ImcpTool;

    private abortControllerLlmResponse: AbortController | undefined;

    private modelSelected: string;
    private fileList: modelChat.Ifile;

    private messageSentCount: number;

    private isAutoScrollEnabled: boolean;

    private unlistenWindowDocumentData: UnlistenFn | undefined = undefined;

    // Method
    private responseReset = (mode?: string): void => {
        this.responseId = "";
        this.responseReason = "";
        this.responseNoReason = "";
        this.responseMcpTool = {} as modelChat.ImcpTool;

        if (mode === "finish") {
            this.messageSentCount = Math.max(0, this.messageSentCount - 1);

            if (this.messageSentCount === 0) {
                this.variableObject.isMessageSendAvailable.state = true;
            }
        }
    };

    private messageStreamReset = (): void => {
        this.hookObject.elementMessageStreamReasonWrapper.classList.add("none");
        this.hookObject.elementMessageStreamReason.textContent = "";

        this.hookObject.elementMessageStreamNoReason.classList.add("none");
        this.hookObject.elementMessageStreamNoReason.textContent = "";
    };

    private messageLoadingHide = (chatMessageIndex: number): void => {
        const chatMessage = this.variableObject.chatMessageList.state[chatMessageIndex];

        if (chatMessage && chatMessage.isLoading) {
            const chatMessageListState = this.variableObject.chatMessageList.state.slice();

            chatMessageListState[chatMessageIndex] = {
                ...chatMessageListState[chatMessageIndex],
                isLoading: false
            };

            this.variableObject.chatMessageList.state = chatMessageListState;
        }
    };

    private autoscroll = (): void => {
        requestAnimationFrame(() => {
            if (this.isAutoScrollEnabled) {
                this.hookObject.elementBottomLimit.scrollIntoView({ block: "end", inline: "nearest" });
            }
        });
    };

    private windowOpenDocument = async (): Promise<void> => {
        const fileNameList = Object.keys(this.fileList);

        if (fileNameList.length > 0) {
            const fileName = fileNameList[0];

            const windowLabel = helperSrc.windowLabelUnique("document", fileName);
            const windowList = await getAllWindows();

            const route = "#/document";

            await helperSrc.windowOpen("document", fileName, route, {
                title: fileName,
                url: route,
                decorations: true,
                resizable: true,
                width: 750,
                height: 1000,
                minWidth: 750,
                minHeight: 1050,
                center: true,
                focus: true
            });

            for (let a = 0; a < windowList.length; a++) {
                const window = windowList[a];

                if (window.label === windowLabel) {
                    await emitTo(windowLabel, "document-content-update", [fileName, "-1"]);

                    delete this.fileList[fileName];

                    break;
                }
            }
        }
    };

    private onClickButtonMessageSend = (): void => {
        if (this.abortControllerLlmResponse && this.responseId) {
            this.abortControllerLlmResponse.abort();
            this.abortControllerLlmResponse = undefined;
        } else {
            this.llmResponse();
        }
    };

    private onClickCitationLink = async (fileName: string, chunk: string): Promise<void> => {
        const systemMode = this.variableObject.systemMode.state;
        const toolSelected = this.variableObject.toolSelected.state;

        this.variableObject.systemMode.state = "tool-call";

        for (let a = 0; a < this.variableObject.toolList.state.length; a++) {
            const tool = this.variableObject.toolList.state[a];

            if (tool.name === "document_parser") {
                this.variableObject.toolSelected.state = tool;

                break;
            }
        }

        this.llmResponse("", `Filename: ${fileName}. Search input: ${chunk}.`);

        this.variableObject.systemMode.state = systemMode;
        this.variableObject.toolSelected.state = toolSelected;
    };

    private onClickCitationTab = (messageIndex: number, tabIndex: number): void => {
        const chatMessageListState = this.variableObject.chatMessageList.state.slice();

        chatMessageListState[messageIndex] = {
            ...chatMessageListState[messageIndex],
            ragCitationTabIndex: tabIndex
        };

        this.variableObject.chatMessageList.state = chatMessageListState;
    };

    setControllerMcp(controller: Mcp): void {
        this.controllerMcp = controller;
    }

    setControllerToast(controller: Toast): void {
        this.controllerToast = controller;
    }

    setModelSelected(modelSelected: string): void {
        this.modelSelected = modelSelected;
    }

    llmResponse = async (mode?: string, prompt?: string): Promise<void> => {
        //const base64 = await invoke("test_screenshot");
        //this.variableObject.modelSelected.state = base64 as string;

        //await invoke("test");

        if (!this.variableObject.isMessageSendAvailable.state && mode !== "rag") {
            this.controllerToast.show("warning", ["Wait for the current response to complete."]);

            return;
        }

        if ((prompt || this.hookObject.elementInputMessageSend.value) && this.modelSelected !== "") {
            this.abortControllerLlmResponse = new AbortController();

            this.responseReset();

            this.messageSentCount++;

            this.variableObject.isMessageSendAvailable.state = false;

            let time = helperSrc.localeFormat(new Date()) as string;
            let userPrompt = this.hookObject.elementInputMessageSend.value;

            if (prompt) {
                time = "";
                userPrompt = "";
            }

            let chatMessageIndex = -1;

            if (mode !== "rag") {
                this.variableObject.chatMessageList.state = [
                    ...this.variableObject.chatMessageList.state,
                    {
                        isLoading: true,
                        time: time,
                        user: userPrompt,
                        assistantReason: this.responseReason,
                        assistantNoReason: this.responseNoReason,
                        mcpTool: this.responseMcpTool,
                        ragCitationList: undefined,
                        ragCitationTabIndex: 0,
                        securityScanner: "",
                        playwright: {} as modelChat.Iplaywright
                    }
                ];
            }

            chatMessageIndex = this.variableObject.chatMessageList.state.length - 1;

            this.isAutoScrollEnabled = true;

            this.autoscroll();

            const inputList: modelChat.IdataInput[] = [];

            /*this.variableObject.chatHistoryList.state.push({
                role: "user",
                content: this.hookObject.elementInputMessageSend.value
            });

            for (let a = 0; a < this.variableObject.chatHistoryList.state.length; a++) {
                const chatHistoryList = this.variableObject.chatHistoryList.state[a];

                if (chatHistoryList.role === "system" || chatHistoryList.role === "user") {
                    inputList.push({
                        role: chatHistoryList.role,
                        content: [{ type: "input_text", text: chatHistoryList.content as string }]
                    });
                } else {
                    inputList.push({
                        role: chatHistoryList.role,
                        content: [{ type: "output_text", text: chatHistoryList.content as string }]
                    });
                }
            }*/

            const systemModeRequest = this.variableObject.systemMode.state;

            let inputSystem = [
                "You are a multilingual assistant that needs to reply with the user prompt language.",
                "You MUST NOT use tools and tasks."
            ].join("\n");

            if (mode === "rag") {
                inputSystem = [
                    "You are a multilingual rag assistant.",
                    "You MUST answer EXCLUSIVELY using the content of the provided CITATION, NODE and GRAPH without inventing or adding information from your side.",
                    "NODE provides the entities and their descriptions, GRAPH provides the relations between them and CITATION provides the source text.",
                    "You MAY use the connections between entities present in GRAPH when the question requires it, but you MUST NOT invent connections that are not explicitly present there.",
                    "For EACH topic answer INDEPENDENTLY and SEPARATELY and write a dedicated section with the topic name as title, followed by bullet points.",
                    "You MUST NOT add commentary about missing information.",
                    "You MUST NOT solve problems.",
                    "You MUST NOT invent new actions.",
                    "You MUST NOT explain nothing."
                ].join("\n");
            }

            if (this.variableObject.systemMode.state === "tool-call") {
                inputSystem = [
                    "You are a multilingual assistant tool executer and you need to transform the user request in a action.",
                    `You MUST use ONLY the following tool: ${this.variableObject.toolSelected.state.name}`,
                    `${this.variableObject.toolSelected.state.inputInstruction}`,
                    "You MUST return ONLY raw json WITHOUT wrap it in ```json and you need change ONLY the 'argumentObject' value without toutch the 'name' default value.",
                    `For ${this.variableObject.toolSelected.state.name} return ALWAYS the json with this format: { "name": "${this.variableObject.toolSelected.state.name}", "argumentObject": ${JSON.stringify(this.variableObject.toolSelected.state.argumentObject)} }`,
                    "You MUST NOT solve problems.",
                    "You MUST NOT invent new actions.",
                    "You MUST NOT explain nothing."
                ].join("\n");
            } else if (this.variableObject.systemMode.state === "task-call") {
                inputSystem = [
                    "You are a multilingual assistant task executer and you need to transform the user request in a ordered list of actions.",
                    `You MUST use ONLY the following tool: ${this.variableObject.taskSelected.state.name}`,
                    `${this.variableObject.taskSelected.state.inputInstruction}`,
                    "You MUST return ONLY raw json WITHOUT wrap it in ```json and you need change ONLY the 'argumentObject' value without toutch the 'name' default value.",
                    `For ${this.variableObject.taskSelected.state.name} return ALWAYS the json with this format: { "list": [ { "name": "${this.variableObject.taskSelected.state.name}", "argumentObject": ${JSON.stringify(this.variableObject.taskSelected.state.argumentObject)} } ] }`,
                    "You MUST NOT solve problems.",
                    "You MUST NOT invent new actions.",
                    "You MUST NOT explain nothing."
                ].join("\n");
            } else if (this.variableObject.systemMode.state === "agent-skill") {
                const skillContent = await this.controllerMcp.apiSkillRead(this.variableObject.agentSelected.state.skillName);

                inputSystem = [
                    window.atob(skillContent),
                    `ONLY if you find a tag [script](...) in the user prompt, you MUST stop and return ONLY the raw json WITHOUT wrap it in \`\`\`json and with this format: { "action": { "skillName": "${this.variableObject.agentSelected.state.skillName}", "scriptName": "" } } where the value of "scriptName" is ONLY the file inside the tag [script](...).`
                ].join("\n");

                const tagUserPromptStart = inputSystem.indexOf("[USER_PROMPT]");
                const tagUserPromptEnd = inputSystem.indexOf("[/USER_PROMPT]");

                if (tagUserPromptStart !== -1 && tagUserPromptEnd !== -1) {
                    const tagUserPrompt = inputSystem.substring(tagUserPromptStart + "[USER_PROMPT]".length, tagUserPromptEnd).trim();

                    inputSystem = (
                        inputSystem.substring(0, tagUserPromptStart) + inputSystem.substring(tagUserPromptEnd + "[/USER_PROMPT]".length)
                    ).trim();

                    userPrompt = `${tagUserPrompt} ${userPrompt}`;
                }
            }

            inputList.push(
                {
                    role: "system",
                    content: [
                        {
                            type: "input_text",
                            text: inputSystem
                        }
                    ]
                },
                {
                    role: "user",
                    content: [{ type: "input_text", text: !prompt ? userPrompt : prompt }]
                }
            );

            const body: modelChat.IapiDataResponseBody = {
                stream: true,
                model: this.modelSelected,
                input: inputList,
                tools: []
            };

            fetch(`${helperSrc.URL_AI}/api/response`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.data.aiBearerToken}`,
                    "ai-cookie": session.data.aiCookie,
                    "mcp-session-id": session.data.mcpSessionId,
                    "mcp-cookie": session.data.mcpCookie
                },
                body: JSON.stringify(body),
                signal: this.abortControllerLlmResponse.signal,
                danger: {
                    acceptInvalidCerts: true,
                    acceptInvalidHostnames: true
                }
            })
                .then(async (resultApi) => {
                    const contentType = resultApi.headers.get("Content-Type");

                    if (!contentType || !contentType.includes("text/event-stream") || !resultApi.body) {
                        helperSrc.writeLog("Chat.ts - llmResponse() - fetch() - Error", "Missing or invalid headers.");

                        return;
                    }

                    const reader = resultApi.body.getReader();
                    const decoder = new TextDecoder("utf-8");
                    let buffer = "";

                    while (true) {
                        const { value, done } = await reader.read();

                        if (done) {
                            this.responseReset("finish");

                            if (this.variableObject.isMessageSendAvailable.state) {
                                this.messageLoadingHide(chatMessageIndex);
                            }

                            break;
                        }

                        buffer += decoder.decode(value, { stream: true });
                        const lineList = buffer.split(/\r?\n/);
                        buffer = lineList.pop() as string;

                        for (let a = 0; a < lineList.length; a++) {
                            const line = lineList[a];

                            if (line.startsWith("data:")) {
                                const data = line.slice(5).trim();

                                const dataTrim = data.trim();

                                if (helperSrc.isJson(dataTrim)) {
                                    const dataTrimObject = JSON.parse(dataTrim) as modelChat.IllmResponse;

                                    if (dataTrimObject.type === "error") {
                                        const error = dataTrimObject.error;

                                        if (error) {
                                            const chatMessageListState = this.variableObject.chatMessageList.state.slice();

                                            chatMessageListState[chatMessageIndex] = {
                                                ...chatMessageListState[chatMessageIndex],
                                                assistantNoReason: error.message
                                            };

                                            this.variableObject.chatMessageList.state = chatMessageListState;

                                            this.messageStreamReset();

                                            this.autoscroll();
                                        }
                                    } else if (dataTrimObject.type === "response.created") {
                                        const response = dataTrimObject.response;

                                        if (response) {
                                            this.responseId = response.id;
                                        }
                                    } else if (dataTrimObject.type === "response.reasoning_text.delta") {
                                        const delta = dataTrimObject.delta;

                                        if (delta) {
                                            this.responseReason += delta;

                                            this.hookObject.elementMessageStreamReasonWrapper.classList.remove("none");
                                            this.hookObject.elementMessageStreamReason.textContent = this.responseReason.trim();

                                            if (systemModeRequest !== "tool-call" && systemModeRequest !== "task-call") {
                                                this.messageLoadingHide(chatMessageIndex);
                                            }

                                            this.autoscroll();
                                        }
                                    } else if (dataTrimObject.type === "response.output_text.delta") {
                                        const delta = dataTrimObject.delta;

                                        if (delta && (!prompt || mode === "rag")) {
                                            this.responseNoReason += delta;

                                            if (systemModeRequest !== "tool-call" && systemModeRequest !== "task-call") {
                                                this.hookObject.elementMessageStreamNoReason.classList.remove("none");
                                                this.hookObject.elementMessageStreamNoReason.textContent = this.responseNoReason.trim();

                                                this.messageLoadingHide(chatMessageIndex);
                                            }

                                            this.autoscroll();
                                        }
                                    } else if (dataTrimObject.type === "response.output_item.done") {
                                        const item = dataTrimObject.item;

                                        if (item && item.type === "mcp_call" && (!prompt || mode === "rag")) {
                                            this.responseMcpTool = {
                                                tool_call_id: item.tool_call_id,
                                                type: item.type,
                                                name: item.name,
                                                arguments: item.arguments,
                                                output: item.output
                                            };

                                            const chatMessageListState = this.variableObject.chatMessageList.state.slice();

                                            chatMessageListState[chatMessageIndex] = {
                                                ...chatMessageListState[chatMessageIndex],
                                                mcpTool: this.responseMcpTool
                                            };

                                            this.variableObject.chatMessageList.state = chatMessageListState;

                                            this.messageLoadingHide(chatMessageIndex);

                                            this.autoscroll();
                                        }
                                    } else if (dataTrimObject.type === "response.completed") {
                                        const chatMessageListState = this.variableObject.chatMessageList.state.slice();

                                        let chatMessage = {
                                            ...chatMessageListState[chatMessageIndex],
                                            assistantReason: this.responseReason.trim()
                                        };

                                        if ((!prompt || mode === "rag") && systemModeRequest !== "tool-call" && systemModeRequest !== "task-call") {
                                            chatMessage = {
                                                ...chatMessage,
                                                assistantNoReason: this.responseNoReason.trim()
                                            };
                                        }

                                        chatMessageListState[chatMessageIndex] = chatMessage;

                                        this.variableObject.chatMessageList.state = chatMessageListState;

                                        this.messageStreamReset();

                                        this.autoscroll();
                                    } else if (dataTrimObject.type === "tool_response") {
                                        const message = dataTrimObject.response.message;
                                        const argument = dataTrimObject.response.arguments;

                                        if (message) {
                                            if (helperSrc.isJson(message)) {
                                                const messageObject = JSON.parse(message) as modelMcp.IllmResponseTool;

                                                this.responseMcpTool = {
                                                    ...this.responseMcpTool,
                                                    type: "tool_response",
                                                    name: messageObject.name,
                                                    arguments: argument,
                                                    output: message
                                                };

                                                const chatMessageListToolState = this.variableObject.chatMessageList.state.slice();

                                                chatMessageListToolState[chatMessageIndex] = {
                                                    ...chatMessageListToolState[chatMessageIndex],
                                                    mcpTool: this.responseMcpTool
                                                };

                                                this.variableObject.chatMessageList.state = chatMessageListToolState;

                                                this.messageLoadingHide(chatMessageIndex);

                                                if (
                                                    messageObject.name === "automate_screenshot" ||
                                                    messageObject.name === "automate_mouse_move" ||
                                                    messageObject.name === "automate_mouse_click" ||
                                                    messageObject.name === "browser_chrome" ||
                                                    messageObject.name === "math_expression" ||
                                                    messageObject.name === "ocr_execute" ||
                                                    messageObject.name === "rag_store" ||
                                                    messageObject.name === "rag_delete"
                                                ) {
                                                    const result = messageObject.result as string;

                                                    const chatMessageListState = this.variableObject.chatMessageList.state.slice();

                                                    chatMessageListState[chatMessageIndex] = {
                                                        ...chatMessageListState[chatMessageIndex],
                                                        assistantNoReason: result
                                                    };

                                                    this.variableObject.chatMessageList.state = chatMessageListState;
                                                } else if (messageObject.name === "document_parser") {
                                                    const result = messageObject.result as modelMcp.IdocumentParser;

                                                    if (Object.keys(result).length > 0) {
                                                        this.fileList[result.fileName] = {
                                                            pageNumber: result.resultExecute
                                                        };

                                                        await this.windowOpenDocument();

                                                        const chatMessageListState = this.variableObject.chatMessageList.state.slice();

                                                        chatMessageListState[chatMessageIndex] = {
                                                            ...chatMessageListState[chatMessageIndex],
                                                            assistantNoReason: "Document opened."
                                                        };

                                                        this.variableObject.chatMessageList.state = chatMessageListState;
                                                    } else {
                                                        const chatMessageListState = this.variableObject.chatMessageList.state.slice();

                                                        chatMessageListState[chatMessageIndex] = {
                                                            ...chatMessageListState[chatMessageIndex],
                                                            assistantNoReason: "Document not found."
                                                        };

                                                        this.variableObject.chatMessageList.state = chatMessageListState;
                                                    }
                                                } else if (messageObject.name === "rag_search") {
                                                    const result = messageObject.result as modelMcp.IragSearch;
                                                    const citationList = result.citationList ? result.citationList : [];
                                                    const nodeList = result.nodeList ? result.nodeList : [];
                                                    const graphList = result.graphList ? result.graphList : [];

                                                    if (citationList.length > 0) {
                                                        const chatMessageListState = this.variableObject.chatMessageList.state.slice();

                                                        chatMessageListState[chatMessageIndex] = {
                                                            ...chatMessageListState[chatMessageIndex],
                                                            ragCitationList: citationList,
                                                            ragCitationTabIndex: 0
                                                        };

                                                        this.variableObject.chatMessageList.state = chatMessageListState;

                                                        this.variableObject.systemMode.state = "chat";

                                                        const citationContextList: string[] = [];

                                                        for (let a = 0; a < citationList.length; a++) {
                                                            citationContextList.push(`[${citationList[a].fileName}]: ${citationList[a].chunk}`);
                                                        }

                                                        const citationContext = citationContextList.join("\n---\n");

                                                        let nodeContext = "";

                                                        if (nodeList.length > 0) {
                                                            const nodeContextList: string[] = [];

                                                            for (let a = 0; a < nodeList.length; a++) {
                                                                let nodeLine = nodeList[a].name;

                                                                if (nodeList[a].type !== "") {
                                                                    nodeLine = `${nodeLine} (${nodeList[a].type})`;
                                                                }

                                                                nodeContextList.push(`${nodeLine}: ${nodeList[a].description}`);
                                                            }

                                                            nodeContext = nodeContextList.join("\n");
                                                        }

                                                        let graphContext = "";

                                                        if (graphList.length > 0) {
                                                            const graphContextList: string[] = [];

                                                            for (let a = 0; a < graphList.length; a++) {
                                                                let graphLine = `${graphList[a].source} ${graphList[a].target}`;

                                                                if (graphList[a].description !== "") {
                                                                    graphLine = `${graphLine} (${graphList[a].description})`;
                                                                }

                                                                graphContextList.push(graphLine);
                                                            }

                                                            graphContext = graphContextList.join("\n");
                                                        }

                                                        this.llmResponse(
                                                            "rag",
                                                            `CITATION:\n${citationContext}\n\nNODE:\n${nodeContext}\n\nGRAPH:\n${graphContext}\n\nText:\n${userPrompt}`
                                                        );

                                                        this.variableObject.systemMode.state = "tool-call";
                                                    } else {
                                                        const chatMessageListState = this.variableObject.chatMessageList.state.slice();

                                                        chatMessageListState[chatMessageIndex] = {
                                                            ...chatMessageListState[chatMessageIndex],
                                                            assistantNoReason: "No citations found."
                                                        };

                                                        this.variableObject.chatMessageList.state = chatMessageListState;
                                                    }
                                                } else if (messageObject.name === "security_scanner") {
                                                    const result = messageObject.result as string;

                                                    const chatMessageListState = this.variableObject.chatMessageList.state.slice();

                                                    chatMessageListState[chatMessageIndex] = {
                                                        ...chatMessageListState[chatMessageIndex],
                                                        securityScanner: result
                                                    };

                                                    this.variableObject.chatMessageList.state = chatMessageListState;
                                                } else if (messageObject.name === "playwright") {
                                                    const result = messageObject.result as modelChat.Iplaywright;

                                                    const chatMessageListState = this.variableObject.chatMessageList.state.slice();

                                                    chatMessageListState[chatMessageIndex] = {
                                                        ...chatMessageListState[chatMessageIndex],
                                                        playwright: result
                                                    };

                                                    this.variableObject.chatMessageList.state = chatMessageListState;
                                                }
                                            }

                                            this.autoscroll();
                                        }
                                    }
                                }
                            }
                        }
                    }
                })
                .catch((error: Error) => {
                    helperSrc.writeLog("Chat.ts - llmResponse() - fetch() - catch()", typeof error === "string" ? error : error.message);

                    this.responseReset("finish");

                    this.messageStreamReset();

                    if (this.variableObject.isMessageSendAvailable.state) {
                        this.messageLoadingHide(chatMessageIndex);
                    }

                    if (error.toString().toLowerCase() === "request cancelled") {
                        const chatMessageListState = this.variableObject.chatMessageList.state.slice();

                        chatMessageListState[chatMessageIndex] = {
                            ...chatMessageListState[chatMessageIndex],
                            assistantNoReason: "Stopped by user."
                        };

                        this.variableObject.chatMessageList.state = chatMessageListState;

                        return;
                    }
                });

            this.hookObject.elementInputMessageSend.value = "";
        }
    };

    constructor() {
        this.variableObject = {} as modelChat.Ivariable;
        this.methodObject = {} as modelChat.Imethod;
        this.controllerMcp = {} as Mcp;
        this.controllerToast = {} as Toast;

        this.responseId = "";
        this.responseReason = "";
        this.responseNoReason = "";
        this.responseMcpTool = {} as modelChat.ImcpTool;

        this.abortControllerLlmResponse = undefined;

        this.modelSelected = "";
        this.fileList = {} as modelChat.Ifile;

        this.messageSentCount = 0;

        this.isAutoScrollEnabled = true;
    }

    hookObject = {} as modelChat.IelementHook;

    variable(): void {
        this.variableObject = variableBind(
            {
                isMessageSendAvailable: true,
                chatMessageList: [],
                chatHistoryList: [],
                systemMode: "chat",
                toolSelected: variableLink<modelMcp.Itool>("Mcp"),
                toolList: variableLink<modelMcp.Itool[]>("Mcp"),
                taskSelected: variableLink<modelMcp.Itask>("Mcp"),
                agentSelected: variableLink<modelMcp.Iagent>("Mcp"),
                playwrightVideoSrc: variableLink<string>("Mcp"),
                playwrightVideoName: variableLink<string>("Mcp")
            },
            this.constructor.name
        );

        this.methodObject = {
            onClickButtonMessageSend: this.onClickButtonMessageSend,
            onClickCitationLink: this.onClickCitationLink,
            onClickCitationTab: this.onClickCitationTab,
            onClickPlaywrightVideoShow: this.controllerMcp.playwrightVideoShow,
            onErrorPlaywrightVideoFail: this.controllerMcp.playwrightVideoFail
        };
    }

    variableEffect(watch: IvariableEffect): void {
        watch([]);
    }

    view(name?: string): IvirtualNode {
        if (name === "message") {
            return viewChat.message(this.variableObject, this.methodObject);
        } else if (name === "input") {
            return viewChat.input(this.variableObject, this.methodObject);
        }

        throw new Error(`Unsupported view: ${String(name)}`);
    }

    event(): void {
        this.hookObject.elementContainerMessageReceive.addEventListener("wheel", (event: WheelEvent) => {
            if (event.deltaY < 0) {
                this.isAutoScrollEnabled = false;
            }
        });

        this.hookObject.elementContainerMessageReceive.addEventListener("scroll", () => {
            const difference =
                this.hookObject.elementContainerMessageReceive.scrollHeight -
                (this.hookObject.elementContainerMessageReceive.scrollTop + this.hookObject.elementContainerMessageReceive.clientHeight);

            this.isAutoScrollEnabled = difference <= 10;
        });

        listen<modelDocument.Idata>("document-data", async (event) => {
            const fileName = event.payload.fileName;

            if (fileName) {
                const windowLabel = helperSrc.windowLabelUnique("document", fileName);

                if (Object.entries(this.fileList).length > 0) {
                    const fileName = Object.keys(this.fileList)[0];
                    const pageNumber = this.fileList[fileName].pageNumber;

                    await emitTo(windowLabel, "document-content-update", [fileName, pageNumber]);

                    delete this.fileList[fileName];
                }

                await this.windowOpenDocument();
            }
        }).then((unlistenFn) => {
            this.unlistenWindowDocumentData = unlistenFn;
        });
    }

    subControllerList(): Icontroller[] {
        const resultList: Icontroller[] = [];

        return resultList;
    }

    rendered(): void {}

    destroy(): void {
        if (this.unlistenWindowDocumentData !== undefined) {
            this.unlistenWindowDocumentData();

            this.unlistenWindowDocumentData = undefined;
        }
    }
}
