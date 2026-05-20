import { Icontroller, IvirtualNode, variableBind, variableLink, IvariableEffect } from "@cimo/jsmvcfw/dist/src/Main.js";
import { fetch } from "@tauri-apps/plugin-http";
import { listen, emitTo } from "@tauri-apps/api/event";

// Source
import * as session from "../Session";
import * as helperSrc from "../HelperSrc";
import * as modelChat from "../model/Chat";
import * as modelMcp from "../model/Mcp";
import * as modelDocument from "../model/Document";
import * as viewChat from "../view/Chat";

export default class Chat implements Icontroller {
    // Variable
    private variableObject: modelChat.Ivariable;
    private methodObject: modelChat.Imethod;

    private responseId: string;
    private responseReason: string;
    private responseNoReason: string;
    private responseMcpTool: modelChat.ImcpTool;

    private abortControllerApiResponse: AbortController | null;

    private modelSelected: string;
    private fileList: modelChat.Ifile;

    // Method
    private resetModelResponse = (): void => {
        this.responseId = "";
        this.responseReason = "";
        this.responseNoReason = "";
        this.responseMcpTool = {} as modelChat.ImcpTool;

        this.variableObject.isMessageSent.state = false;
    };

    private onClickButtonMessageSend = (): void => {
        if (this.abortControllerApiResponse && this.responseId) {
            this.abortControllerApiResponse.abort();
            this.abortControllerApiResponse = null;
        } else {
            this.apiResponse();
        }
    };

    private onClickSourceLink = async (event: Event, fileName: string, searchInput: string): Promise<void> => {
        event.preventDefault();

        const systemMode = this.variableObject.systemMode.state;
        const toolSelected = this.variableObject.toolSelected.state;

        this.variableObject.systemMode.state = "tool-call";

        for (const tool of this.variableObject.toolList.state) {
            if (tool.name === "document_parser") {
                this.variableObject.toolSelected.state = tool;

                break;
            }
        }

        this.apiResponse(`Filename: ${fileName}. Search input: ${searchInput}.`);

        this.variableObject.systemMode.state = systemMode;
        this.variableObject.toolSelected.state = toolSelected;
    };

    private openWindowDocument = async (): Promise<void> => {
        const fileNameList = Object.keys(this.fileList);

        if (fileNameList.length > 0) {
            const fileName = fileNameList[0];

            await helperSrc.openWindow("document", fileName, "#/document");

            const windowLabel = helperSrc.appWindowLabelUnique("document", fileName);

            await emitTo(windowLabel, "document-content-update", [fileName, "-1"]);
        }
    };

    setModelSelected(modelSelected: string): void {
        this.modelSelected = modelSelected;
    }

    apiResponse = async (prompt?: string, mode?: string): Promise<void> => {
        //const base64 = await invoke("test_screenshot");
        //this.variableObject.modelSelected.state = base64 as string;

        //await invoke("test");

        if ((prompt || this.hookObject.elementInputMessageSend.value) && this.modelSelected !== "") {
            this.abortControllerApiResponse = new AbortController();

            this.resetModelResponse();

            let time = helperSrc.localeFormat(new Date()) as string;
            let userPrompt = this.hookObject.elementInputMessageSend.value;

            if (prompt) {
                time = "";
                userPrompt = "";
            }

            this.variableObject.chatMessageList.state.push({
                time: time,
                user: userPrompt,
                assistantReason: this.responseReason,
                assistantNoReason: this.responseNoReason,
                mcpTool: this.responseMcpTool,
                citation: undefined,
                scanner: ""
            });

            this.autoscroll(false);

            const input: modelChat.IchatInput[] = [];

            /*this.variableObject.chatHistoryList.state.push({
                role: "user",
                content: this.hookObject.elementInputMessageSend.value
            });

            for (const chatHistoryList of this.variableObject.chatHistoryList.state) {
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
                "You MUST need to reason step by step and give a answer to the user question.",
                "You MUST NOT use tools and tasks."
            ].join("\n");

            if (mode === "rag") {
                inputSystem += [
                    "You MUST ONLY use the provided CITATION to answer the user question.",
                    "You MUST NOT add any information that is not provided in the CITATION."
                ].join("\n");
            }

            if (this.variableObject.systemMode.state === "tool-call") {
                inputSystem = [
                    "You are a multilingual assistant tool executer that needs to reply with the user input language and you need to transform the user request in a action.",
                    `You MUST use ONLY the following tool: ${this.variableObject.toolSelected.state.name}`,
                    `For ${this.variableObject.toolSelected.state.name} you MUST return ONLY valid JSON with this format without additional information: { "name": "${this.variableObject.toolSelected.state.name}", "argumentObject": ${JSON.stringify(this.variableObject.toolSelected.state.argumentObject)} }`,
                    "You MUST NOT solve problems.",
                    "You MUST NOT invent new actions.",
                    "You MUST NOT explain nothing."
                ].join("\n");
            } else if (this.variableObject.systemMode.state === "task-call") {
                inputSystem = [
                    "You are a multilingual assistant tool task executer that needs to reply with the user input language and you need to transform the user request in a ordered list of actions.",
                    `You MUST use ONLY the following tool: ${this.variableObject.taskSelected.state.name}`,
                    `For ${this.variableObject.taskSelected.state.name} you MUST return ONLY valid JSON with this format without additional information: { "list": [ { "name": "${this.variableObject.taskSelected.state.name}", "argumentObject": ${JSON.stringify(this.variableObject.taskSelected.state.argumentObject)} } ] }`,
                    "You MUST NOT solve problems.",
                    "You MUST NOT invent new actions.",
                    "You MUST NOT explain nothing."
                ].join("\n");
            } else if (this.variableObject.systemMode.state === "agent-skill") {
                inputSystem = [
                    this.variableObject.agentInputSystem.state,
                    'If you find a tag [script](...) in the text you MUST stop and write ONLY valid JSON with this format without additional information: { "action": { "script": true } }'
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
                    Cookie: session.data.aiCookie,
                    "mcp-session-id": session.data.mcpSessionId,
                    "cookie-mcp": session.data.mcpCookie
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
                .then(async (result) => {
                    this.variableObject.isMessageSent.state = true;

                    const contentType = result.headers.get("Content-Type");

                    if (!contentType || !contentType.includes("text/event-stream") || !result.body) {
                        helperSrc.writeLog("Chat.ts - apiResponse() - fetch() - Error", "Missing or invalid headers.");

                        return;
                    }

                    const reader = result.body.getReader();
                    const decoder = new TextDecoder("utf-8");
                    let buffer = "";

                    while (true) {
                        const { value, done } = await reader.read();

                        if (done) {
                            this.resetModelResponse();

                            break;
                        }

                        buffer += decoder.decode(value, { stream: true });
                        const lineList = buffer.split(/\r?\n/);
                        buffer = lineList.pop() || "";

                        for (const line of lineList) {
                            if (line.startsWith("data:")) {
                                const data = line.slice(5).trim();

                                const dataTrim = data.trim();

                                if (dataTrim.length > 1 && dataTrim[0] === "{" && dataTrim[dataTrim.length - 1] === "}") {
                                    const dataTrimParse = JSON.parse(dataTrim) as modelChat.IapiResponse;

                                    if (dataTrimParse.type === "error") {
                                        const dataError = dataTrimParse.error;

                                        if (dataError) {
                                            const idx = this.variableObject.chatMessageList.state.length - 1;

                                            const chatMessageListState = this.variableObject.chatMessageList.state.slice();

                                            chatMessageListState[idx] = {
                                                ...chatMessageListState[idx],
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

                                            const index = this.variableObject.chatMessageList.state.length - 1;

                                            const chatMessageListState = this.variableObject.chatMessageList.state.slice();

                                            chatMessageListState[index] = {
                                                ...chatMessageListState[index],
                                                assistantReason: this.responseReason.trim()
                                            };

                                            this.variableObject.chatMessageList.state = chatMessageListState;

                                            this.autoscroll(true);
                                        }
                                    } else if (dataTrimParse.type === "response.output_text.delta") {
                                        const dataDelta = dataTrimParse.delta;

                                        if (dataDelta && (!prompt || mode === "rag")) {
                                            this.responseNoReason += dataDelta;

                                            const index = this.variableObject.chatMessageList.state.length - 1;

                                            const chatMessageListState = this.variableObject.chatMessageList.state.slice();

                                            chatMessageListState[index] = {
                                                ...chatMessageListState[index],
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

                                            const index = this.variableObject.chatMessageList.state.length - 1;

                                            const chatMessageListState = this.variableObject.chatMessageList.state.slice();

                                            chatMessageListState[index] = {
                                                ...chatMessageListState[index],
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
                                            const index = this.variableObject.chatMessageList.state.length - 1;

                                            if (helperSrc.isJson(dataResponse)) {
                                                const toolResponse = JSON.parse(dataResponse) as modelMcp.IapiToolResponse;

                                                if (
                                                    toolResponse.name === "automate_screenshot" ||
                                                    toolResponse.name === "automate_mouse_move" ||
                                                    toolResponse.name === "automate_mouse_click" ||
                                                    toolResponse.name === "chrome" ||
                                                    toolResponse.name === "math_expression" ||
                                                    toolResponse.name === "ocr_execute" ||
                                                    toolResponse.name === "rag_store" ||
                                                    toolResponse.name === "rag_delete"
                                                ) {
                                                    const resultList = toolResponse.resultList as string[];

                                                    const chatMessageListState = this.variableObject.chatMessageList.state.slice();

                                                    chatMessageListState[index] = {
                                                        ...chatMessageListState[index],
                                                        assistantNoReason: resultList[0]
                                                    };

                                                    this.variableObject.chatMessageList.state = chatMessageListState;
                                                } else if (toolResponse.name === "document_parser") {
                                                    const parserList = toolResponse.resultList as modelMcp.IdocumentParser[];
                                                    const parser = parserList[0];

                                                    if (Object.keys(parser).length > 0) {
                                                        this.fileList[parser.fileName] = {
                                                            pageNumber: parser.terminalExecution
                                                        };

                                                        await this.openWindowDocument();

                                                        const chatMessageListState = this.variableObject.chatMessageList.state.slice();

                                                        chatMessageListState[index] = {
                                                            ...chatMessageListState[index],
                                                            assistantNoReason: "Document opened."
                                                        };

                                                        this.variableObject.chatMessageList.state = chatMessageListState;
                                                    } else {
                                                        const chatMessageListState = this.variableObject.chatMessageList.state.slice();

                                                        chatMessageListState[index] = {
                                                            ...chatMessageListState[index],
                                                            assistantNoReason: "Document not found."
                                                        };

                                                        this.variableObject.chatMessageList.state = chatMessageListState;
                                                    }
                                                } else if (toolResponse.name === "rag_search") {
                                                    const citationList = toolResponse.resultList as modelMcp.IragSearch[];

                                                    if (citationList.length > 0) {
                                                        const chatMessageListState = this.variableObject.chatMessageList.state.slice();

                                                        chatMessageListState[index] = {
                                                            ...chatMessageListState[index],
                                                            citation: citationList
                                                        };

                                                        this.variableObject.chatMessageList.state = chatMessageListState;

                                                        this.variableObject.systemMode.state = "chat";

                                                        this.apiResponse(
                                                            `CITATION:\n${JSON.stringify(toolResponse.resultList)}\n\nText: ${userPrompt}`,
                                                            "rag"
                                                        );

                                                        this.variableObject.systemMode.state = "tool-call";
                                                    } else {
                                                        const chatMessageListState = this.variableObject.chatMessageList.state.slice();

                                                        chatMessageListState[index] = {
                                                            ...chatMessageListState[index],
                                                            assistantNoReason: "No citations found."
                                                        };

                                                        this.variableObject.chatMessageList.state = chatMessageListState;
                                                    }
                                                } else if (toolResponse.name === "security_scanner") {
                                                    const resultList = toolResponse.resultList as string[];

                                                    const chatMessageListState = this.variableObject.chatMessageList.state.slice();

                                                    chatMessageListState[index] = {
                                                        ...chatMessageListState[index],
                                                        scanner: resultList[0]
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

                    this.resetModelResponse();

                    if (error.toString().toLowerCase() === "request cancelled") {
                        const idx = this.variableObject.chatMessageList.state.length - 1;

                        const chatMessageListState = this.variableObject.chatMessageList.state.slice();

                        chatMessageListState[idx] = {
                            ...chatMessageListState[idx],
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

        this.responseId = "";
        this.responseReason = "";
        this.responseNoReason = "";
        this.responseMcpTool = {} as modelChat.ImcpTool;

        this.abortControllerApiResponse = null;

        this.modelSelected = "";
        this.fileList = {};
    }

    hookObject = {} as modelChat.IelementHook;

    variable(): void {
        this.variableObject = variableBind(
            {
                isMessageSent: false,
                chatMessageList: [],
                chatHistoryList: [],
                systemMode: "chat",
                agentInputSystem: "",
                toolSelected: variableLink<modelMcp.Itool>("Mcp"),
                toolList: variableLink<modelMcp.Itool[]>("Mcp"),
                taskSelected: variableLink<modelMcp.Itask>("Mcp")
            },
            this.constructor.name
        );

        this.methodObject = {
            onClickButtonMessageSend: this.onClickButtonMessageSend,
            onClickSourceLink: this.onClickSourceLink
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
            await listen<modelDocument.Idata>("document-init", async (event) => {
                const fileName = event.payload.fileName;

                if (fileName) {
                    const windowLabel = helperSrc.appWindowLabelUnique("document", fileName);

                    if (Object.entries(this.fileList).length > 0) {
                        const fileName = Object.keys(this.fileList)[0];
                        const pageNumber = this.fileList[fileName].pageNumber;

                        await emitTo(windowLabel, "document-content-update", [fileName, pageNumber]);

                        delete this.fileList[fileName];
                    }
                }

                await this.openWindowDocument();
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
