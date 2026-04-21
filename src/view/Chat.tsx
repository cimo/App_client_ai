import { jsxFactory, jsxFragment, IvirtualNode } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelChat from "../model/Chat";

export const message = (variableObject: modelChat.Ivariable, methodObject: modelChat.Imethod): IvirtualNode => {
    return (
        <div class="view_chat_message">
            <div class="container_chat" jsmvcfw-elementHookName="elementContainerMessageReceive">
                {(() => {
                    const result: IvirtualNode[] = [];

                    for (const [key, value] of Object.entries(variableObject.chatMessageList.state)) {
                        result.push(
                            <div key={key} data-chat-index={key}>
                                <div class={`container_chat_user ${value.user ? "" : "none"}`}>
                                    <p class="time">{value.time}</p>
                                    <pre class="message">{value.user}</pre>
                                </div>
                                <div class="container_chat_assistant">
                                    <details class={value.mcpTool && value.mcpTool["name"] ? "" : "none"}>
                                        <summary>
                                            <i class="cls_icon">handyman</i>
                                            <p>Show tool</p>
                                        </summary>
                                        {(() => {
                                            const result: IvirtualNode[] = [];

                                            if (value.mcpTool) {
                                                result.push(
                                                    <ul class="list">
                                                        <li>Name: {value.mcpTool["name"]}</li>
                                                        <li>Argument: {value.mcpTool["arguments"]}</li>
                                                        <li>Output: {value.mcpTool["output"]}</li>
                                                    </ul>
                                                );
                                            }

                                            return result;
                                        })()}
                                    </details>
                                    <details class={value.assistantReason ? "" : "none"}>
                                        <summary>
                                            <i class="cls_icon">generating_tokens</i>
                                            <p>Show reason</p>
                                        </summary>
                                        <pre>{value.assistantReason}</pre>
                                    </details>
                                    {(() => {
                                        const result: IvirtualNode[] = [];

                                        if (value.assistantNoReason === "") {
                                            result.push(<i class="cls_icon">update</i>);
                                        } else if (typeof value.assistantNoReason === "string") {
                                            if (value.file) {
                                                result.push(
                                                    <details open>
                                                        <summary>
                                                            <p>{value.assistantNoReason}</p>
                                                        </summary>
                                                        <ul class="file">
                                                            {(() => {
                                                                const result: IvirtualNode[] = [];

                                                                if (value.file !== "") {
                                                                    const fileList = JSON.parse(value.file);

                                                                    for (const [keyFile, valueFile] of Object.entries(fileList)) {
                                                                        result.push(
                                                                            <li key={keyFile}>
                                                                                <i class="cls_icon">file_present</i>
                                                                                <p>{valueFile}</p>
                                                                            </li>
                                                                        );
                                                                    }
                                                                }

                                                                return result;
                                                            })()}
                                                        </ul>
                                                    </details>
                                                );
                                            } else if (value.citation.length > 0) {
                                                result.push(
                                                    <details open>
                                                        <summary>
                                                            <p>Data</p>
                                                        </summary>
                                                        <div class="json">
                                                            {(() => {
                                                                const result: IvirtualNode[] = [];

                                                                for (let a = 0; a < value.citation.length; a++) {
                                                                    const data = value.citation[a];

                                                                    if (typeof data !== "string") {
                                                                        const fileName = data.fileName;
                                                                        const citation = data.citation || "";

                                                                        result.push(
                                                                            <>
                                                                                <p>
                                                                                    Citation {a + 1} - {fileName}
                                                                                </p>
                                                                                <a
                                                                                    class="source_link"
                                                                                    href="#"
                                                                                    onClick={(event: Event) => {
                                                                                        methodObject.onClickSourceLink(event, fileName, citation);
                                                                                    }}
                                                                                >
                                                                                    (source)
                                                                                </a>
                                                                                <pre>{citation}</pre>
                                                                            </>
                                                                        );
                                                                    }
                                                                }

                                                                return result;
                                                            })()}
                                                        </div>
                                                    </details>
                                                );
                                            } else {
                                                result.push(<pre>{value.assistantNoReason}</pre>);
                                            }
                                        }

                                        return result;
                                    })()}
                                </div>
                            </div>
                        );
                    }

                    return result;
                })()}
                <div class="bottom_limit" jsmvcfw-elementHookName="elementBottomLimit"></div>
            </div>
        </div>
    );
};

export const input = (variableObject: modelChat.Ivariable, methodObject: modelChat.Imethod): IvirtualNode => {
    return (
        <div class="view_chat_input">
            <div class="container_message_send">
                <textarea jsmvcfw-elementHookName="elementInputMessageSend" name="messageSend" rows="4"></textarea>
                <div class="container_action">
                    <div class="left">
                        <aside jsmvcfw-controllerName="Mcp" view="upload" />
                    </div>
                    <div class="right">
                        <button
                            onClick={() => {
                                methodObject.onClickButtonMessageSend();
                            }}
                        >
                            <i class="cls_icon">{variableObject.isMessageSent.state ? "stop" : "play_arrow"}</i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
