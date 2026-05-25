import { jsxFactory, IvirtualNode } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelChat from "../model/Chat";

export const message = (variableObject: modelChat.Ivariable, methodObject: modelChat.Imethod): IvirtualNode => {
    const messageList: modelChat.IchatMessage[] = variableObject.chatMessageList.state;

    return (
        <div class="view_chat_message">
            <div class="container_chat" jsmvcfw-elementHookName="elementContainerMessageReceive">
                {(() => {
                    const result: IvirtualNode[] = [];

                    for (const [key, value] of Object.entries(messageList)) {
                        const messageIndex = parseInt(key);

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

                                        if (value.assistantNoReason === "" && !value.ragCitation && !value.securityScanner) {
                                            result.push(<i class="cls_icon">update</i>);
                                        } else if (typeof value.assistantNoReason === "string") {
                                            if (value.ragCitation) {
                                                result.push(
                                                    <details open>
                                                        <summary>
                                                            <p>Citation result:</p>
                                                        </summary>
                                                        <div class="citation_container">
                                                            <div class="citation_nav">
                                                                <button
                                                                    class="citation_nav_button"
                                                                    onClick={() => {
                                                                        methodObject.onClickCitationTab(
                                                                            messageIndex,
                                                                            Math.max(0, value.ragCitationTabIndex - 1)
                                                                        );
                                                                    }}
                                                                >
                                                                    <i class="cls_icon">chevron_left</i>
                                                                </button>
                                                                <span class="citation_nav_label">
                                                                    RAG Citation {value.ragCitationTabIndex + 1} / {value.ragCitation.length}
                                                                </span>
                                                                <button
                                                                    class="citation_nav_button"
                                                                    onClick={() => {
                                                                        if (value.ragCitation) {
                                                                            methodObject.onClickCitationTab(
                                                                                messageIndex,
                                                                                Math.min(value.ragCitation.length - 1, value.ragCitationTabIndex + 1)
                                                                            );
                                                                        }
                                                                    }}
                                                                >
                                                                    <i class="cls_icon">chevron_right</i>
                                                                </button>
                                                            </div>
                                                            {(() => {
                                                                const result: IvirtualNode[] = [];
                                                                const data = value.ragCitation[value.ragCitationTabIndex];

                                                                if (data && typeof data !== "string") {
                                                                    const fileName = data.fileName;
                                                                    const citation = data.citation || "";

                                                                    result.push(
                                                                        <div class="citation">
                                                                            <p class="title">
                                                                                <i class="cls_icon">text_snippet</i>
                                                                                <span>
                                                                                    [{value.ragCitationTabIndex + 1}] {fileName}
                                                                                </span>
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
                                                                            <pre>{citation.trim()}</pre>
                                                                        </div>
                                                                    );
                                                                }

                                                                return result;
                                                            })()}
                                                        </div>
                                                        {(() => {
                                                            const result: IvirtualNode[] = [];

                                                            if (value.ragRelationList && value.ragRelationList.length > 0) {
                                                                result.push(
                                                                    <div class="relation_container">
                                                                        <p class="relation_title">
                                                                            <i class="cls_icon">account_tree</i>
                                                                            <span>Relation:</span>
                                                                        </p>
                                                                        <ul class="relation_list">
                                                                            {(() => {
                                                                                const result: IvirtualNode[] = [];

                                                                                for (let a = 0; a < value.ragRelationList.length; a++) {
                                                                                    const rel = value.ragRelationList[a];

                                                                                    result.push(
                                                                                        <li key={a} class="relation_item">
                                                                                            <span class="relation_source">{rel.source}</span>
                                                                                            <span class="relation_verb">{rel.relation}</span>
                                                                                            <span class="relation_target">{rel.target}</span>
                                                                                        </li>
                                                                                    );
                                                                                }

                                                                                return result;
                                                                            })()}
                                                                        </ul>
                                                                    </div>
                                                                );
                                                            }

                                                            return result;
                                                        })()}
                                                    </details>
                                                );

                                                if (value.assistantNoReason) {
                                                    result.push(<pre>{value.assistantNoReason}</pre>);
                                                }
                                            } else if (value.securityScanner) {
                                                result.push(
                                                    <details open class="scanner_container">
                                                        <summary>
                                                            <p>Security scanner result:</p>
                                                        </summary>
                                                        <pre class="security_scanner">{value.securityScanner}</pre>
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
                    <div class="left"></div>
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
