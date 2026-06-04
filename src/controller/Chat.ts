import { Icontroller, IvirtualNode, variableBind, variableLink, IvariableEffect } from "@cimo/jsmvcfw/dist/src/Main.js";
import { fetch } from "@tauri-apps/plugin-http";
import { listen, emitTo } from "@tauri-apps/api/event";
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

    private abortControllerApiResponse: AbortController | undefined;

    private modelSelected: string;
    private fileList: modelChat.Ifile;

    private messageSentCount: number;

    // Method
    private resetModelResponse = (mode?: string): void => {
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

    private onClickButtonMessageSend = (): void => {
        if (this.abortControllerApiResponse && this.responseId) {
            this.abortControllerApiResponse.abort();
            this.abortControllerApiResponse = undefined;
        } else {
            this.apiResponse();
        }
    };

    private onClickCitationLink = async (event: Event, fileName: string, chunk: string): Promise<void> => {
        event.preventDefault();

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

        this.apiResponse("", `Filename: ${fileName}. Search input: ${chunk}.`);

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

    setControllerMcp(controller: Mcp): void {
        this.controllerMcp = controller;
    }

    setControllerToast(controller: Toast): void {
        this.controllerToast = controller;
    }

    setModelSelected(modelSelected: string): void {
        this.modelSelected = modelSelected;
    }

    apiResponse = async (mode?: string, prompt?: string): Promise<void> => {
        //const base64 = await invoke("test_screenshot");
        //this.variableObject.modelSelected.state = base64 as string;

        //await invoke("test");

        if (!this.variableObject.isMessageSendAvailable.state && mode !== "rag") {
            this.controllerToast.show("warning", ["Wait for the current response to complete."]);

            return;
        }

        if ((prompt || this.hookObject.elementInputMessageSend.value) && this.modelSelected !== "") {
            this.abortControllerApiResponse = new AbortController();

            this.resetModelResponse();

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
                        time: time,
                        user: userPrompt,
                        assistantReason: this.responseReason,
                        assistantNoReason: this.responseNoReason,
                        mcpTool: this.responseMcpTool,
                        ragCitation: undefined,
                        ragCitationTabIndex: 0,
                        ragRelationList: [],
                        securityScanner: ""
                    }
                ];
            }

            chatMessageIndex = this.variableObject.chatMessageList.state.length - 1;

            this.autoscroll(false);

            const input: modelChat.IchatInput[] = [];

            /*this.variableObject.chatHistoryList.state.push({
                role: "user",
                content: this.hookObject.elementInputMessageSend.value
            });

            for (let a = 0; a < this.variableObject.chatHistoryList.state.length; a++) {
                const chatHistoryList = this.variableObject.chatHistoryList.state[a];

                if (chatHistoryList.role === "system" || chatHistoryList.role === "user") {
                    input.push({
                        role: chatHistoryList.role,
                        content: [{ type: "input_text", text: chatHistoryList.content as string }]
                    });
                } else {
                    input.push({
                        role: chatHistoryList.role,
                        content: [{ type: "output_text", text: chatHistoryList.content as string }]
                    });
                }
            }*/

            let inputSystem = [
                "You are a multilingual assistant that needs to reply with the user input language.",
                "You MUST NOT use tools and tasks."
            ].join("\n");

            if (mode === "rag") {
                inputSystem = [
                    "You are a multilingual RAG assistant that needs to reply ALWAYS with the user input language.",
                    "You MUST answer EXCLUSIVELY using the content of the provided CITATION and RELATION without inventing or adding information from your side.",
                    "For EACH topic answer INDEPENDENTLY and SEPARATELY and write a dedicated section with the topic name as title, followed by bullet points.",
                    "You MUST NOT look for relationships or connections between entities unless the question explicitly asks for them.",
                    "You MUST NOT add commentary about missing information.",
                    "You MUST NOT solve problems.",
                    "You MUST NOT invent new actions.",
                    "You MUST NOT explain nothing."
                ].join("\n");
            }

            if (this.variableObject.systemMode.state === "tool-call") {
                inputSystem = [
                    "You are a multilingual assistant tool executer that needs to reply ALWAYS with the user input language and you need to transform the user request in a action.",
                    `You MUST use ONLY the following tool: ${this.variableObject.toolSelected.state.name}`,
                    `${this.variableObject.toolSelected.state.inputInstruction}`,
                    "You MUST return ONLY raw json WITHOUT wrap it in ```json",
                    `For ${this.variableObject.toolSelected.state.name} return ALWAYS the json with this format: { "name": "${this.variableObject.toolSelected.state.name}", "argumentObject": ${JSON.stringify(this.variableObject.toolSelected.state.argumentObject)} }`,
                    "You MUST NOT solve problems.",
                    "You MUST NOT invent new actions.",
                    "You MUST NOT explain nothing."
                ].join("\n");
            } else if (this.variableObject.systemMode.state === "task-call") {
                inputSystem = [
                    "You are a multilingual assistant task executer that needs to reply ALWAYS with the user input language and you need to transform the user request in a ordered list of actions.",
                    `You MUST use ONLY the following tool: ${this.variableObject.taskSelected.state.name}`,
                    `${this.variableObject.taskSelected.state.inputInstruction}`,
                    "You MUST return ONLY raw json WITHOUT wrap it in ```json",
                    `For ${this.variableObject.taskSelected.state.name} return ALWAYS the json with this format: { "list": [ { "name": "${this.variableObject.taskSelected.state.name}", "argumentObject": ${JSON.stringify(this.variableObject.taskSelected.state.argumentObject)} } ] }`,
                    "You MUST NOT solve problems.",
                    "You MUST NOT invent new actions.",
                    "You MUST NOT explain nothing."
                ].join("\n");
            } else if (this.variableObject.systemMode.state === "agent-skill") {
                const skillContent = await this.controllerMcp.apiSkillRead(this.variableObject.agentSelected.state.skill);

                let skillDescription = "";

                if (skillContent) {
                    skillDescription = window.atob(skillContent);
                }

                inputSystem = [
                    skillDescription,
                    'If you find a tag [script](...) in the text you MUST stop and return ALWAYS the json with this format: { "action": { "script": true } }'
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

            input.push(
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

            fetch(`${helperSrc.URL_AI}/api/response`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.data.aiBearerToken}`,
                    "ai-cookie": session.data.aiCookie,
                    "mcp-session-id": session.data.mcpSessionId,
                    "mcp-cookie": session.data.mcpCookie
                },
                body: JSON.stringify({
                    stream: true,
                    model: this.modelSelected,
                    input,
                    tools: []
                }),
                signal: this.abortControllerApiResponse.signal,
                danger: {
                    acceptInvalidCerts: true,
                    acceptInvalidHostnames: true
                }
            })
                .then(async (resultApi) => {
                    const contentType = resultApi.headers.get("Content-Type");

                    if (!contentType || !contentType.includes("text/event-stream") || !resultApi.body) {
                        helperSrc.writeLog("Chat.ts - apiResponse() - fetch() - Error", "Missing or invalid headers.");

                        return;
                    }

                    const reader = resultApi.body.getReader();
                    const decoder = new TextDecoder("utf-8");
                    let buffer = "";

                    while (true) {
                        const { value, done } = await reader.read();

                        if (done) {
                            this.resetModelResponse("finish");

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
                                    const dataTrimParse = JSON.parse(dataTrim) as modelChat.IapiResponse;

                                    if (dataTrimParse.type === "error") {
                                        const dataError = dataTrimParse.error;

                                        if (dataError) {
                                            const chatMessageListState = this.variableObject.chatMessageList.state.slice();

                                            chatMessageListState[chatMessageIndex] = {
                                                ...chatMessageListState[chatMessageIndex],
                                                assistantNoReason: dataError.message
                                            };

                                            this.variableObject.chatMessageList.state = chatMessageListState;

                                            this.autoscroll(false);
                                        }
                                    } else if (dataTrimParse.type === "response.created") {
                                        const dataResponse = dataTrimParse.response;

                                        if (dataResponse) {
                                            this.responseId = dataResponse.id;
                                        }
                                    } else if (dataTrimParse.type === "response.reasoning_text.delta") {
                                        const dataDelta = dataTrimParse.delta;

                                        if (dataDelta) {
                                            this.responseReason += dataDelta;

                                            const chatMessageListState = this.variableObject.chatMessageList.state.slice();

                                            chatMessageListState[chatMessageIndex] = {
                                                ...chatMessageListState[chatMessageIndex],
                                                assistantReason: this.responseReason.trim()
                                            };

                                            this.variableObject.chatMessageList.state = chatMessageListState;

                                            this.autoscroll(true);
                                        }
                                    } else if (dataTrimParse.type === "response.output_text.delta") {
                                        const dataDelta = dataTrimParse.delta;

                                        if (dataDelta && (!prompt || mode === "rag")) {
                                            this.responseNoReason += dataDelta;

                                            const chatMessageListState = this.variableObject.chatMessageList.state.slice();

                                            chatMessageListState[chatMessageIndex] = {
                                                ...chatMessageListState[chatMessageIndex],
                                                assistantNoReason: this.responseNoReason.trim()
                                            };

                                            this.variableObject.chatMessageList.state = chatMessageListState;

                                            this.autoscroll(true);
                                        }
                                    } else if (dataTrimParse.type === "response.output_item.done") {
                                        const dataItem = dataTrimParse.item;

                                        if (dataItem && dataItem.type === "mcp_call" && (!prompt || mode === "rag")) {
                                            this.responseMcpTool = {
                                                tool_call_id: dataItem.tool_call_id,
                                                type: dataItem.type,
                                                name: dataItem.name,
                                                arguments: dataItem.arguments,
                                                output: dataItem.output
                                            };

                                            const chatMessageListState = this.variableObject.chatMessageList.state.slice();

                                            chatMessageListState[chatMessageIndex] = {
                                                ...chatMessageListState[chatMessageIndex],
                                                mcpTool: this.responseMcpTool
                                            };

                                            this.variableObject.chatMessageList.state = chatMessageListState;

                                            this.autoscroll(true);
                                        }
                                    } else if (dataTrimParse.type === "response.completed") {
                                        this.autoscroll(false);
                                    } else if (dataTrimParse.type === "tool_response") {
                                        const dataResponse = dataTrimParse.response.message;

                                        if (dataResponse) {
                                            if (helperSrc.isJson(dataResponse)) {
                                                const toolResponse = JSON.parse(dataResponse) as modelMcp.IapiToolResponse;

                                                if (
                                                    toolResponse.name === "automate_screenshot" ||
                                                    toolResponse.name === "automate_mouse_move" ||
                                                    toolResponse.name === "automate_mouse_click" ||
                                                    toolResponse.name === "browser_chrome" ||
                                                    toolResponse.name === "math_expression" ||
                                                    toolResponse.name === "ocr_execute" ||
                                                    toolResponse.name === "rag_store" ||
                                                    toolResponse.name === "rag_delete"
                                                ) {
                                                    const result = toolResponse.result as string;

                                                    const chatMessageListState = this.variableObject.chatMessageList.state.slice();

                                                    chatMessageListState[chatMessageIndex] = {
                                                        ...chatMessageListState[chatMessageIndex],
                                                        assistantNoReason: result
                                                    };

                                                    this.variableObject.chatMessageList.state = chatMessageListState;
                                                } else if (toolResponse.name === "document_parser") {
                                                    const parser = toolResponse.result as modelMcp.IdocumentParser;

                                                    if (Object.keys(parser).length > 0) {
                                                        this.fileList[parser.fileName] = {
                                                            pageNumber: parser.resultExecute
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
                                                } else if (toolResponse.name === "rag_search") {
                                                    const ragSearch = toolResponse.result as modelMcp.IragSearch;
                                                    const citationList = ragSearch.citationList ?? [];
                                                    const relationList = ragSearch.relationList ?? [];

                                                    if (citationList.length > 0) {
                                                        const chatMessageListState = this.variableObject.chatMessageList.state.slice();

                                                        chatMessageListState[chatMessageIndex] = {
                                                            ...chatMessageListState[chatMessageIndex],
                                                            ragCitation: citationList,
                                                            ragCitationTabIndex: 0,
                                                            ragRelationList: relationList.length > 0 ? relationList : []
                                                        };

                                                        this.variableObject.chatMessageList.state = chatMessageListState;

                                                        this.variableObject.systemMode.state = "chat";

                                                        const citationContextList: string[] = [];

                                                        for (let a = 0; a < Math.min(6, citationList.length); a++) {
                                                            citationContextList.push(`[${citationList[a].fileName}]: ${citationList[a].chunk}`);
                                                        }

                                                        const citationContext = citationContextList.join("\n---\n");

                                                        let relationContext = "";

                                                        if (relationList.length > 0) {
                                                            const relationContextList: string[] = [];

                                                            for (let a = 0; a < Math.min(20, relationList.length); a++) {
                                                                relationContextList.push(
                                                                    `${relationList[a].source} ${relationList[a].verb} ${relationList[a].target}`
                                                                );
                                                            }

                                                            relationContext = relationContextList.join("\n");
                                                        }

                                                        this.apiResponse(
                                                            "rag",
                                                            `CITATION:\n${citationContext}\n\nRELATION:\n${relationContext}\n\nText:\n${userPrompt}`
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
                                                } else if (toolResponse.name === "security_scanner") {
                                                    const result = toolResponse.result as string;

                                                    const chatMessageListState = this.variableObject.chatMessageList.state.slice();

                                                    chatMessageListState[chatMessageIndex] = {
                                                        ...chatMessageListState[chatMessageIndex],
                                                        securityScanner: result
                                                    };

                                                    this.variableObject.chatMessageList.state = chatMessageListState;
                                                }
                                            }

                                            this.autoscroll(false);
                                        }
                                    }
                                }
                            }
                        }
                    }
                })
                .catch((error: Error) => {
                    helperSrc.writeLog("Chat.ts - apiResponse() - fetch() - catch()", typeof error === "string" ? error : error.message);

                    this.resetModelResponse("finish");

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

    autoscroll = (isAuto: boolean): void => {
        const elementContainerMessageReceive = this.hookObject.elementContainerMessageReceive;
        const elementBottomLimit = this.hookObject.elementBottomLimit;

        const difference =
            elementContainerMessageReceive.scrollHeight - (elementContainerMessageReceive.scrollTop + elementContainerMessageReceive.clientHeight);
        const threshold = 10;
        const isAtBottom = difference <= threshold;

        elementContainerMessageReceive.dataset["autoScroll"] = isAtBottom ? "true" : "false";

        requestAnimationFrame(() => {
            if (elementContainerMessageReceive.dataset["autoScroll"] === "false" && isAuto) {
                return;
            }

            elementBottomLimit.scrollIntoView({ block: "end", inline: "nearest" });
        });
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

        this.abortControllerApiResponse = undefined;

        this.modelSelected = "";
        this.fileList = {};

        this.messageSentCount = 0;
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
                agentSelected: variableLink<modelMcp.Iagent>("Mcp")
            },
            this.constructor.name
        );

        this.methodObject = {
            onClickButtonMessageSend: this.onClickButtonMessageSend,
            onClickCitationLink: this.onClickCitationLink,
            onClickCitationTab: this.onClickCitationTab
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
        (async () => {
            await listen<modelDocument.Idata>("document-data", async (event) => {
                const fileName = event.payload.fileName;

                if (fileName) {
                    const windowLabel = helperSrc.windowLabelUnique("document", fileName);

                    if (Object.entries(this.fileList).length > 0) {
                        const fileName = Object.keys(this.fileList)[0];
                        const pageNumber = this.fileList[fileName].pageNumber;

                        await emitTo(windowLabel, "document-content-update", [fileName, pageNumber]);

                        delete this.fileList[fileName];
                    }
                }

                await this.windowOpenDocument();
            });
        })();
    }

    subControllerList(): Icontroller[] {
        const resultList: Icontroller[] = [];

        return resultList;
    }

    rendered(): void {}

    destroy(): void {}
}
