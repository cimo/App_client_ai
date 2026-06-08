import { jsxFactory, IvirtualNode } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelChat from "../model/Chat";

export const message = (variableObject: modelChat.Ivariable, methodObject: modelChat.Imethod): IvirtualNode => {
    const messageList: modelChat.IchatMessage[] = variableObject.chatMessageList.state;

    return (
        <div class="view_chat_message">
            <div class="chat_wrapper" jsmvcfw-elementHookName="elementContainerMessageReceive">
                {(() => {
                    const resultList: IvirtualNode[] = [];

                    for (const [key, value] of Object.entries(messageList)) {
                        const messageIndex = parseInt(key);

                        resultList.push(
                            <div key={key} data-chat-index={key}>
                                <div class={`chat_user_wrapper ${value.user ? "" : "none"}`}>
                                    <p class="time">{value.time}</p>
                                    <pre class="message">{value.user}</pre>
                                </div>
                                <div class="chat_assistant_wrapper">
                                    <details class={value.mcpTool && value.mcpTool["name"] ? "" : "none"}>
                                        <summary>
                                            <i class="cls_icon">handyman</i>
                                            <p>Show tool</p>
                                        </summary>
                                        {(() => {
                                            const resultList: IvirtualNode[] = [];

                                            if (value.mcpTool) {
                                                resultList.push(
                                                    <ul>
                                                        <li>Name: {value.mcpTool["name"]}</li>
                                                        <li>Argument: {value.mcpTool["arguments"]}</li>
                                                        <li>Output: {value.mcpTool["output"]}</li>
                                                    </ul>
                                                );
                                            }

                                            return resultList;
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
                                        const resultList: IvirtualNode[] = [];

                                        if (value.assistantNoReason === "" && !value.ragCitationList && !value.securityScanner) {
                                            resultList.push(<i class="cls_icon">update</i>);
                                        } else if (typeof value.assistantNoReason === "string") {
                                            if (value.ragCitationList) {
                                                resultList.push(
                                                    <details open>
                                                        <summary>
                                                            <p>Citation result:</p>
                                                        </summary>
                                                        <div class="citation_wrapper">
                                                            <div class="pagination_wrapper">
                                                                <button
                                                                    onClick={() => {
                                                                        methodObject.onClickCitationTab(
                                                                            messageIndex,
                                                                            Math.max(0, value.ragCitationTabIndex - 1)
                                                                        );
                                                                    }}
                                                                >
                                                                    <i class="cls_icon">chevron_left</i>
                                                                </button>
                                                                <span class="label">
                                                                    {value.ragCitationTabIndex + 1} / {value.ragCitationList.length}
                                                                </span>
                                                                <button
                                                                    onClick={() => {
                                                                        if (value.ragCitationList) {
                                                                            methodObject.onClickCitationTab(
                                                                                messageIndex,
                                                                                Math.min(
                                                                                    value.ragCitationList.length - 1,
                                                                                    value.ragCitationTabIndex + 1
                                                                                )
                                                                            );
                                                                        }
                                                                    }}
                                                                >
                                                                    <i class="cls_icon">chevron_right</i>
                                                                </button>
                                                            </div>
                                                            {(() => {
                                                                const resultList: IvirtualNode[] = [];
                                                                const citation = value.ragCitationList[value.ragCitationTabIndex];

                                                                if (citation && typeof citation !== "string") {
                                                                    resultList.push(
                                                                        <div class="box">
                                                                            <p class="title">
                                                                                <i class="cls_icon">text_snippet</i>
                                                                                <span>
                                                                                    [{value.ragCitationTabIndex + 1}] {citation.fileName}
                                                                                </span>
                                                                            </p>
                                                                            <a
                                                                                class="link"
                                                                                href="#"
                                                                                onClick={(event: Event) => {
                                                                                    methodObject.onClickCitationLink(
                                                                                        event,
                                                                                        citation.fileName,
                                                                                        citation.chunk
                                                                                    );
                                                                                }}
                                                                            >
                                                                                (source)
                                                                            </a>
                                                                            <pre>{citation.chunk}</pre>
                                                                        </div>
                                                                    );
                                                                }

                                                                return resultList;
                                                            })()}
                                                        </div>
                                                        {(() => {
                                                            const resultList: IvirtualNode[] = [];

                                                            if (value.ragRelationList && value.ragRelationList.length > 0) {
                                                                resultList.push(
                                                                    <div class="relation_wrapper">
                                                                        <p class="title">
                                                                            <i class="cls_icon">account_tree</i>
                                                                            <span>Relation:</span>
                                                                        </p>
                                                                        <ul>
                                                                            {(() => {
                                                                                const resultList: IvirtualNode[] = [];

                                                                                const entryList = Object.entries(value.ragRelationList);

                                                                                for (const [key, value] of entryList) {
                                                                                    resultList.push(
                                                                                        <li key={key}>
                                                                                            <span class="source">{value.source}</span>
                                                                                            <span class="verb">{value.verb}</span>
                                                                                            <span class="target">{value.target}</span>
                                                                                        </li>
                                                                                    );
                                                                                }

                                                                                return resultList;
                                                                            })()}
                                                                        </ul>
                                                                    </div>
                                                                );
                                                            }

                                                            return resultList;
                                                        })()}
                                                    </details>
                                                );

                                                if (value.assistantNoReason) {
                                                    resultList.push(<pre>{value.assistantNoReason}</pre>);
                                                }
                                            } else if (value.securityScanner) {
                                                resultList.push(
                                                    <details open class="scanner_wrapper">
                                                        <summary>
                                                            <p>Security scanner result:</p>
                                                        </summary>
                                                        <pre class="security_scanner">{value.securityScanner}</pre>
                                                    </details>
                                                );
                                            } else {
                                                resultList.push(<pre>{value.assistantNoReason}</pre>);
                                            }
                                        }

                                        return resultList;
                                    })()}
                                </div>
                            </div>
                        );
                    }

                    return resultList;
                })()}
                <div class="bottom_limit" jsmvcfw-elementHookName="elementBottomLimit"></div>
            </div>
        </div>
    );
};

export const input = (variableObject: modelChat.Ivariable, methodObject: modelChat.Imethod): IvirtualNode => {
    return (
        <div class="view_chat_input">
            <div class="message_send_wrapper">
                <textarea jsmvcfw-elementHookName="elementInputMessageSend" name="messageSend" rows="4"></textarea>
                <div class="action_wrapper">
                    <div class="left"></div>
                    <div class="right">
                        <button
                            onClick={() => {
                                methodObject.onClickButtonMessageSend();
                            }}
                        >
                            <i class="cls_icon">{variableObject.isMessageSendAvailable.state ? "play_arrow" : "stop"}</i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
