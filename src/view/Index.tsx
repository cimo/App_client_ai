import { jsxFactory, IvirtualNode } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelIndex from "../model/Index";

const viewIndex = (variableObject: modelIndex.Ivariable, methodObject: modelIndex.Imethod): IvirtualNode => {
    return (
        <div class="page_container view_index" jsmvcfw-controllerName="Index">
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
                    <pre class={`dialog ${!variableObject.isOpenDialogModelList.state ? "none" : ""}`}>
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
            <div
                jsmvcfw-elementHookName="elementContainerMessageReceive"
                class={`container_message_receive ${variableObject.isOffline.state ? "none" : ""}`}
            >
                {(() => {
                    const result: IvirtualNode[] = [];

                    for (const [key, value] of Object.entries(variableObject.chatMessage.state)) {
                        result.push(
                            <div key={key}>
                                <div class="container_chat">
                                    <p>{value.time}</p>
                                    <pre>{value.user}</pre>
                                </div>
                                <i class={`cls_icon ${value.assistantReason || value.assistantNoReason ? "none" : ""}`}>update</i>
                                <details class={!value.assistantReason ? "none" : ""}>
                                    <summary>
                                        <i class="cls_icon">generating_tokens</i>Show reason
                                    </summary>
                                    <pre>{value.assistantReason}</pre>
                                </details>
                                <details class={value.mcpTool && !value.mcpTool.name ? "none" : ""}>
                                    <summary>
                                        <i class="cls_icon">handyman</i>Show tool
                                    </summary>
                                    {(() => {
                                        const result: IvirtualNode[] = [];

                                        if (value.mcpTool) {
                                            result.push(
                                                <div>
                                                    <p>Name: {value.mcpTool["name"]}</p>
                                                    <p>Argument: {value.mcpTool["arguments"]}</p>
                                                    <p>Output: {value.mcpTool["output"]}</p>
                                                </div>
                                            );
                                        }

                                        return result;
                                    })()}
                                </details>
                                <pre>{value.assistantNoReason}</pre>
                            </div>
                        );
                    }

                    return result;
                })()}
                <div jsmvcfw-elementHookName="elementBottomLimit" class="bottom_limit"></div>
            </div>
            <div
                class={`container_main_icon ${!variableObject.isOffline.state ? "none" : ""}`}
                onclick={() => {
                    methodObject.onClickRefreshPage();
                }}
            >
                <i class="cls_icon">report_off</i>
                <p>Click here for re-connect.</p>
            </div>
            <div
                class={`container_main_icon ${variableObject.adUrl.state === "" ? "none" : ""}`}
                onclick={() => {
                    methodObject.onClickAd();
                }}
            >
                <i class="cls_icon">login</i>
                <p>Click here for connect to AD.</p>
            </div>
            <div class="container_message_send">
                <textarea jsmvcfw-elementHookName="elementInputMessageSend" name="messageSend" rows="4"></textarea>
                <button
                    onclick={() => {
                        methodObject.onClickButtonMessageSend();
                    }}
                >
                    <i class="cls_icon">play_arrow</i>
                </button>
            </div>
        </div>
    );
};

export default viewIndex;
