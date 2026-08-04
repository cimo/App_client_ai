import { fetch } from "@tauri-apps/plugin-http";

// Source
import * as session from "../Session";
import * as helperSrc from "../HelperSrc";
import * as modelHelperSrc from "../model/HelperSrc";
import * as modelChat from "../model/Chat";
import * as modelMcp from "../model/Mcp";
import * as modelLlm from "../model/Llm";

const toolResponse = async <T extends modelLlm.IdataContext>(
    tThis: T,
    message: string,
    argument: string,
    userPrompt: string,
    messageIndex: number
): Promise<void> => {
    if (message) {
        if (helperSrc.jsonCheck(message)) {
            const messageObject = JSON.parse(message) as modelMcp.ItoolResult;

            tThis.controllerChat.responseMcpTool = {
                ...tThis.controllerChat.responseMcpTool,
                type: "tool_response",
                name: messageObject.name,
                arguments: argument,
                output: message
            };

            const messageListToolState = tThis.controllerChat.variableObject.messageList.state.slice();

            messageListToolState[messageIndex] = {
                ...messageListToolState[messageIndex],
                mcpToolBody: tThis.controllerChat.responseMcpTool
            };

            tThis.controllerChat.variableObject.messageList.state = messageListToolState;

            tThis.controllerChat.messageLoadingHide(messageIndex);

            if (
                messageObject.name === "automate_screenshot" ||
                messageObject.name === "automate_mouse_move" ||
                messageObject.name === "automate_mouse_click" ||
                messageObject.name === "browser_chrome" ||
                messageObject.name === "math_expression" ||
                messageObject.name === "ocr" ||
                messageObject.name === "rag_store" ||
                messageObject.name === "rag_delete"
            ) {
                const result = messageObject.result as string;

                const messageListState = tThis.controllerChat.variableObject.messageList.state.slice();

                messageListState[messageIndex] = {
                    ...messageListState[messageIndex],
                    assistantNoReason: result
                };

                tThis.controllerChat.variableObject.messageList.state = messageListState;
            } else if (messageObject.name === "document_parser") {
                const result = messageObject.result as modelMcp.IdocumentParser;

                if (Object.keys(result).length > 0) {
                    tThis.controllerChat.fileObject[result.fileName] = {
                        searchInput: result.searchInput
                    };

                    await tThis.controllerChat.windowOpenDocument(result.fileName);

                    const messageListState = tThis.controllerChat.variableObject.messageList.state.slice();

                    messageListState[messageIndex] = {
                        ...messageListState[messageIndex],
                        assistantNoReason: "Document opened."
                    };

                    tThis.controllerChat.variableObject.messageList.state = messageListState;
                } else {
                    const messageListState = tThis.controllerChat.variableObject.messageList.state.slice();

                    messageListState[messageIndex] = {
                        ...messageListState[messageIndex],
                        assistantNoReason: "Document not found."
                    };

                    tThis.controllerChat.variableObject.messageList.state = messageListState;
                }
            } else if (messageObject.name === "rag_search") {
                const result = messageObject.result as modelMcp.IragSearch;
                const citationList = result.citationList ? result.citationList : [];
                const nodeList = result.nodeList ? result.nodeList : [];
                const graphList = result.graphList ? result.graphList : [];

                if (citationList.length > 0) {
                    const messageListState = tThis.controllerChat.variableObject.messageList.state.slice();

                    messageListState[messageIndex] = {
                        ...messageListState[messageIndex],
                        ragCitationList: citationList,
                        ragCitationTabIndex: 0
                    };

                    tThis.controllerChat.variableObject.messageList.state = messageListState;

                    tThis.controllerChat.variableObject.systemMode.state = "chat";

                    const citationContextList: string[] = [];

                    for (let a = 0; a < citationList.length; a++) {
                        citationContextList.push(`[${citationList[a].fileName}]: ${citationList[a].chunk}`);
                    }

                    const citationContextJoin = citationContextList.join("\n---\n");

                    let nodeContextJoin = "";

                    if (nodeList.length > 0) {
                        const nodeContextList: string[] = [];

                        for (let a = 0; a < nodeList.length; a++) {
                            let nodeLine = nodeList[a].name;

                            if (nodeList[a].type !== "") {
                                nodeLine = `${nodeLine} (${nodeList[a].type})`;
                            }

                            nodeContextList.push(`${nodeLine}: ${nodeList[a].description}`);
                        }

                        nodeContextJoin = nodeContextList.join("\n");
                    }

                    let graphContextJoin = "";

                    if (graphList.length > 0) {
                        const graphContextList: string[] = [];

                        for (let a = 0; a < graphList.length; a++) {
                            let graphLine = `${graphList[a].source} ${graphList[a].target}`;

                            if (graphList[a].description !== "") {
                                graphLine = `${graphLine} (${graphList[a].description})`;
                            }

                            graphContextList.push(graphLine);
                        }

                        graphContextJoin = graphContextList.join("\n");
                    }

                    tThis.apiResponse(
                        "rag",
                        `CITATION:\n${citationContextJoin}\n\nNODE:\n${nodeContextJoin}\n\nGRAPH:\n${graphContextJoin}\n\nText:\n${userPrompt}`
                    );

                    tThis.controllerChat.variableObject.systemMode.state = "tool-call";
                } else {
                    const messageListState = tThis.controllerChat.variableObject.messageList.state.slice();

                    messageListState[messageIndex] = {
                        ...messageListState[messageIndex],
                        assistantNoReason: "No citations found."
                    };

                    tThis.controllerChat.variableObject.messageList.state = messageListState;
                }
            } else if (messageObject.name === "security_scanner") {
                const result = messageObject.result as string;

                const messageListState = tThis.controllerChat.variableObject.messageList.state.slice();

                messageListState[messageIndex] = {
                    ...messageListState[messageIndex],
                    securityScanner: result
                };

                tThis.controllerChat.variableObject.messageList.state = messageListState;
            } else if (messageObject.name === "playwright") {
                const result = messageObject.result as modelChat.Iplaywright;

                const messageListState = tThis.controllerChat.variableObject.messageList.state.slice();

                messageListState[messageIndex] = {
                    ...messageListState[messageIndex],
                    playwright: result
                };

                tThis.controllerChat.variableObject.messageList.state = messageListState;
            }
        } else {
            const messageListToolState = tThis.controllerChat.variableObject.messageList.state.slice();

            messageListToolState[messageIndex] = {
                ...messageListToolState[messageIndex],
                assistantNoReason: message
            };

            tThis.controllerChat.variableObject.messageList.state = messageListToolState;

            tThis.controllerChat.messageLoadingHide(messageIndex);
        }

        tThis.controllerChat.autoscroll();
    } else {
        const messageListToolState = tThis.controllerChat.variableObject.messageList.state.slice();

        messageListToolState[messageIndex] = {
            ...messageListToolState[messageIndex],
            assistantNoReason: "Tool response empty."
        };

        tThis.controllerChat.variableObject.messageList.state = messageListToolState;

        tThis.controllerChat.messageLoadingHide(messageIndex);

        tThis.controllerChat.autoscroll();
    }
};

export const updateModel = <T extends modelLlm.IdataContext>(tThis: T, modelList: string[], isShowDropdown: boolean): void => {
    tThis.controllerChat.variableObject.modelList.state = modelList;

    if (isShowDropdown) {
        tThis.controllerChat.variableObject.isOpenDropdownModelList.state = true;
    } else {
        if (
            tThis.controllerChat.variableObject.modelSelected.state === "" ||
            !tThis.controllerChat.variableObject.modelList.state.includes(tThis.controllerChat.variableObject.modelSelected.state)
        ) {
            tThis.controllerChat.variableObject.modelSelected.state = tThis.controllerChat.variableObject.modelList.state[0];
        }
    }
};

export const inputPrompt = async <T extends modelLlm.IdataContext>(tThis: T, prompt?: string, mode?: string): Promise<modelLlm.IdataInputPrompt> => {
    tThis.controllerChat.variableObject.isMessageSendAvailable.state = false;

    let time = helperSrc.localeFormat(new Date()) as string;
    let resultUserPrompt = tThis.controllerChat.hookObject.elementInputMessageSend.value;

    if (prompt) {
        time = "";
        resultUserPrompt = "";
    }

    if (mode !== "rag") {
        tThis.controllerChat.variableObject.messageList.state = [
            ...tThis.controllerChat.variableObject.messageList.state,
            {
                isLoading: true,
                time: time,
                user: resultUserPrompt,
                assistantReason: tThis.controllerChat.responseReason,
                assistantNoReason: tThis.controllerChat.responseNoReason,
                mcpToolBody: tThis.controllerChat.responseMcpTool,
                ragCitationList: undefined,
                ragCitationTabIndex: 0,
                securityScanner: "",
                playwright: {} as modelChat.Iplaywright
            }
        ];
    }

    let resultSystemPrompt = [
        "You are a multilingual assistant that needs to reply with the user prompt language.",
        "You MUST NOT use tools and tasks."
    ].join("\n");

    if (mode === "rag") {
        resultSystemPrompt = [
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

    if (tThis.controllerChat.variableObject.systemMode.state === "tool-call") {
        resultSystemPrompt = [
            "You are a multilingual assistant tool executer and you need to transform the user request in a action.",
            `You MUST use ONLY the following tool: ${tThis.controllerChat.variableObject.toolSelected.state.name}`,
            `${tThis.controllerChat.variableObject.toolSelected.state.inputInstruction}`,
            "You MUST return ONLY raw json WITHOUT wrap it in ```json and you need change ONLY the 'argumentObject' value without toutch the 'name' default value.",
            `For ${tThis.controllerChat.variableObject.toolSelected.state.name} return ALWAYS the json with this format: { "name": "${tThis.controllerChat.variableObject.toolSelected.state.name}", "argumentObject": ${JSON.stringify(tThis.controllerChat.variableObject.toolSelected.state.argumentObject)} }`,
            "You MUST NOT solve problems.",
            "You MUST NOT invent new actions.",
            "You MUST NOT explain nothing."
        ].join("\n");
    } else if (tThis.controllerChat.variableObject.systemMode.state === "task-call") {
        resultSystemPrompt = [
            "You are a multilingual assistant task executer and you need to transform the user request in a ordered list of actions.",
            `You MUST use ONLY the following tool: ${tThis.controllerChat.variableObject.taskSelected.state.name}`,
            `${tThis.controllerChat.variableObject.taskSelected.state.inputInstruction}`,
            "You MUST return ONLY raw json WITHOUT wrap it in ```json and you need change ONLY the 'argumentObject' value without toutch the 'name' default value.",
            `For ${tThis.controllerChat.variableObject.taskSelected.state.name} return ALWAYS the json with this format: { "list": [ { "name": "${tThis.controllerChat.variableObject.taskSelected.state.name}", "argumentObject": ${JSON.stringify(tThis.controllerChat.variableObject.taskSelected.state.argumentObject)} } ] }`,
            "You MUST NOT solve problems.",
            "You MUST NOT invent new actions.",
            "You MUST NOT explain nothing."
        ].join("\n");
    } else if (tThis.controllerChat.variableObject.systemMode.state === "agent-skill") {
        const skillContent = await tThis.controllerChat.controllerMcp.apiSkillRead(tThis.controllerChat.variableObject.agentSelected.state.skillName);

        resultSystemPrompt = [
            window.atob(skillContent),
            `ONLY if you find a tag [script](...) in the user prompt, you MUST stop and return ONLY the raw json WITHOUT wrap it in \`\`\`json and with this format: { "action": { "skillName": "${tThis.controllerChat.variableObject.agentSelected.state.skillName}", "scriptName": "" } } where the value of "scriptName" is ONLY the file inside the tag [script](...).`
        ].join("\n");

        const tagUserPromptStart = resultSystemPrompt.indexOf("[USER_PROMPT]");
        const tagUserPromptEnd = resultSystemPrompt.indexOf("[/USER_PROMPT]");

        if (tagUserPromptStart !== -1 && tagUserPromptEnd !== -1) {
            const tagUserPrompt = resultSystemPrompt.substring(tagUserPromptStart + "[USER_PROMPT]".length, tagUserPromptEnd).trim();

            resultSystemPrompt = (
                resultSystemPrompt.substring(0, tagUserPromptStart) + resultSystemPrompt.substring(tagUserPromptEnd + "[/USER_PROMPT]".length)
            ).trim();

            resultUserPrompt = `${tagUserPrompt} ${resultUserPrompt}`;
        }
    }

    return { resultUserPrompt, resultSystemPrompt };
};

export const mcpJsonResponse = async <T extends modelLlm.IdataContext>(
    tThis: T,
    responseCompleted: string,
    userPrompt: string,
    messageIndex: number
): Promise<void> => {
    const responseCompletedObject = JSON.parse(responseCompleted) as modelMcp.IapiLlmToolResponse | modelMcp.IapiLlmTaskResponse;

    if ("name" in responseCompletedObject) {
        await fetch(`${helperSrc.URL_MCP}/api/tool-call`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "mcp-session-id": session.data.mcpSessionId,
                "mcp-cookie": session.data.mcpCookie
            },
            body: JSON.stringify({
                jsonrpc: "2.0",
                id: 1,
                method: "tools/call",
                params: {
                    protocolVersion: "2025-06-18",
                    capabilities: {},
                    clientInfo: {
                        name: "curl",
                        version: "1.0"
                    },
                    name: responseCompletedObject.name,
                    arguments: responseCompletedObject.argumentObject
                }
            }),
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        })
            .then(async (resultToolCall) => {
                const json = (await resultToolCall.json()) as modelHelperSrc.IapiResponse;

                const stdoutObject = JSON.parse(json.response.stdout) as modelMcp.IapiToolCallResponse;

                let message = "";

                if (stdoutObject.result && stdoutObject.result.content && stdoutObject.result.content[0]) {
                    message = stdoutObject.result.content[0].text;
                }

                toolResponse(tThis, message, JSON.stringify(responseCompletedObject.argumentObject), userPrompt, messageIndex);
            })
            .catch((error: Error) => {
                toolResponse(tThis, error.message, "", userPrompt, messageIndex);
            });
    } else if ("list" in responseCompletedObject) {
        await fetch(`${helperSrc.URL_MCP}/api/task-call`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "mcp-session-id": session.data.mcpSessionId,
                "mcp-cookie": session.data.mcpCookie
            },
            body: JSON.stringify(responseCompletedObject),
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        })
            .then(async (resultToolCall) => {
                const json = (await resultToolCall.json()) as modelHelperSrc.IapiResponse;

                toolResponse(tThis, json.response.stdout, "", userPrompt, messageIndex);
            })
            .catch((error: Error) => {
                toolResponse(tThis, error.message, "", userPrompt, messageIndex);
            });
    }
};
