import { jsxFactory, IvirtualNode } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelIndex from "../model/Index";

const viewIndex = (variableObject: modelIndex.Ivariable, methodObject: modelIndex.Imethod): IvirtualNode => {
    return (
        <div class="page_container" jsmvcfw-controllerName="Index">
            <div class={`container_over ${variableObject.isOffline.state || variableObject.adUrl.state !== "" ? "" : "none"}`}>
                <div
                    class={variableObject.isOffline.state ? "" : "none"}
                    onclick={() => {
                        methodObject.onClickRefreshPage();
                    }}
                >
                    <i class="cls_icon">report_off</i>
                    <p>Click here for re-connect.</p>
                </div>
                <div
                    class={!variableObject.isOffline.state && variableObject.adUrl.state !== "" ? "" : "none"}
                    onclick={(event: Event) => {
                        methodObject.onClickAd(event);
                    }}
                >
                    <i class="cls_icon">login</i>
                    <p>Click here for connect to AD.</p>
                </div>
            </div>
            <div class="container_actionBar">
                <p>Model selected: {variableObject.modelSelected.state}</p>
                <div class="selector_model">
                    <div
                        class="cls_icon"
                        onclick={() => {
                            methodObject.onClickButtonModel();
                        }}
                    >
                        schema
                    </div>
                    <pre class={`dialog ${variableObject.isOpenDialogModelList.state ? "" : "none"}`}>
                        <p class="title">Model list:</p>
                        <ul>
                            {(() => {
                                const result: IvirtualNode[] = [];

                                for (const [key, value] of Object.entries(variableObject.modelList.state)) {
                                    result.push(
                                        <li
                                            key={key}
                                            onClick={() => {
                                                methodObject.onClickModelName(value.id);
                                            }}
                                        >
                                            {value.id}
                                        </li>
                                    );
                                }

                                return result;
                            })()}
                        </ul>
                    </pre>
                </div>
            </div>
            <div class="container_message_receive" jsmvcfw-elementHookName="elementContainerMessageReceive">
                {(() => {
                    const result: IvirtualNode[] = [];

                    for (const [key, value] of Object.entries(variableObject.chatMessage.state)) {
                        result.push(
                            <div key={key}>
                                <div class="container_chat_user">
                                    <p class="time">{value.time}</p>
                                    <pre class="message">{value.user}</pre>
                                </div>
                                <div class="container_chat_assistant">
                                    <details class={value.mcpTool && value.mcpTool.name ? "" : "none"}>
                                        <summary>
                                            <i class="cls_icon">handyman</i>
                                            <p>Show tool</p>
                                        </summary>
                                        {(() => {
                                            const result: IvirtualNode[] = [];

                                            if (value.mcpTool) {
                                                result.push(
                                                    <div class="list">
                                                        <p>Name: {value.mcpTool["name"]}</p>
                                                        <p>Argument: {value.mcpTool["arguments"]}</p>
                                                        <p>Output: {value.mcpTool["output"]}</p>
                                                    </div>
                                                );
                                            }

                                            return result;
                                        })()}
                                    </details>
                                    <i class={`cls_icon ${value.assistantReason || value.assistantNoReason ? "none" : ""}`}>update</i>
                                    <details class={value.assistantReason ? "" : "none"}>
                                        <summary>
                                            <i class="cls_icon">generating_tokens</i>
                                            <p>Show reason</p>
                                        </summary>
                                        <pre>{value.assistantReason}</pre>
                                    </details>
                                    <pre>{value.assistantNoReason}</pre>
                                </div>
                            </div>
                        );
                    }

                    return result;
                })()}
                <div class="bottom_limit" jsmvcfw-elementHookName="elementBottomLimit"></div>
            </div>
            <div class="container_message_send">
                <textarea jsmvcfw-elementHookName="elementInputMessageSend" name="messageSend" rows="4"></textarea>
                <div class="container_action">
                    <button
                        onclick={() => {
                            methodObject.onClickButtonMessageSend();
                        }}
                    >
                        <i class="cls_icon">play_arrow</i>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default viewIndex;
