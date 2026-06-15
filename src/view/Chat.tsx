import { jsxFactory, IvirtualNode } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as helperSrc from "../HelperSrc";
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
                            <div key={key}>
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
                                                        <li>
                                                            Output:
                                                            <pre>
                                                                {helperSrc.isJson(value.mcpTool["output"])
                                                                    ? JSON.stringify(JSON.parse(value.mcpTool["output"]), null, 4)
                                                                    : value.mcpTool["output"]}
                                                            </pre>
                                                        </li>
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
                                    <i
                                        class={`cls_icon ${value.assistantNoReason === "" && !value.ragCitationList && !value.securityScanner ? "" : "none"}`}
                                        jsmvcfw-elementHookName={`elementIconUpdateMessageList_${key}`}
                                    >
                                        update
                                    </i>
                                    {(() => {
                                        const resultList: IvirtualNode[] = [];

                                        if (
                                            (value.assistantNoReason !== "" || value.ragCitationList || value.securityScanner) &&
                                            typeof value.assistantNoReason === "string"
                                        ) {
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
                <div class="chat_assistant_wrapper">
                    <details class="none" jsmvcfw-elementHookName="elementMessageStreamReasonWrapper">
                        <summary>
                            <i class="cls_icon">generating_tokens</i>
                            <p>Show reason</p>
                        </summary>
                        <pre jsmvcfw-elementHookName="elementMessageStreamReason"></pre>
                    </details>
                    <pre class="none" jsmvcfw-elementHookName="elementMessageStreamNoReason"></pre>
                </div>
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
