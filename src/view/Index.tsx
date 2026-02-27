import { jsxFactory, IvirtualNode } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelIndex from "../model/Index";

const viewIndex = (variableObject: modelIndex.Ivariable, methodObject: modelIndex.Imethod): IvirtualNode => {
    return (
        <div class="page_container" jsmvcfw-controllerName="Index">
            <div
                class={`container_over ${variableObject.isOfflineAi.state || variableObject.isOfflineMcp.state || variableObject.adUrl.state !== "" ? "" : "none"}`}
            >
                <div
                    class={variableObject.isOfflineAi.state || variableObject.isOfflineMcp.state ? "" : "none"}
                    onclick={() => {
                        methodObject.onClickRefreshPage();
                    }}
                >
                    <i class="cls_icon">report_off</i>
                    <p>Click here for re-connect.</p>
                </div>
                <div
                    class={!variableObject.isOfflineAi.state && !variableObject.isOfflineMcp.state && variableObject.adUrl.state !== "" ? "" : "none"}
                    onclick={(event: Event) => {
                        methodObject.onClickAd(event);
                    }}
                >
                    <i class="cls_icon">login</i>
                    <p>Click here for connect to AD.</p>
                </div>
            </div>
            <div class="container_header">
                <p>Model selected: {variableObject.modelSelected.state}</p>
                <div class="dropdown">
                    <i
                        class="cls_icon"
                        onclick={() => {
                            methodObject.onClickDropdownModel();
                        }}
                    >
                        schema
                    </i>
                    <div class={`menu ${variableObject.isOpenDropdownModelList.state ? "" : "none"}`}>
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
                    </div>
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
                                    <pre class={`message ${value.user ? "" : "none"}`}>{value.user}</pre>
                                    <ul class={`message file ${value.file ? "" : "none"}`}>
                                        {(() => {
                                            const result: IvirtualNode[] = [];

                                            const fileList = value.file.split(", ");

                                            for (const [keyFile, valueFile] of fileList.entries()) {
                                                result.push(
                                                    <li key={keyFile}>
                                                        <p>{valueFile}</p>
                                                        <i class="cls_icon">file_present</i>
                                                    </li>
                                                );
                                            }

                                            return result;
                                        })()}
                                    </ul>
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
                                            result.push(<i class={`cls_icon ${value.assistantReason ? "" : "none"}`}>update</i>);
                                        } else {
                                            result.push(<pre>{value.assistantNoReason}</pre>);
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
            <div class="container_available_item">
                <div class="dropdown">
                    <div
                        class="chip"
                        onclick={() => {
                            methodObject.onClickChipTool();
                        }}
                    >
                        <i class="cls_icon">construction</i>
                        <p>Tool</p>
                    </div>
                    <div class={`menu ${variableObject.isOpenDropdownToolList.state ? "" : "none"}`}>
                        <ul>
                            {(() => {
                                // eslint-disable-next-line no-console
                                console.log("cimo", variableObject.isOpenDropdownToolList.state);

                                const result: IvirtualNode[] = [];

                                if (variableObject.agentMode.state === "tool-call") {
                                    for (const [key, value] of variableObject.toolList.state.entries()) {
                                        result.push(<li key={key}>{value}</li>);
                                    }
                                }

                                return result;
                            })()}
                        </ul>
                    </div>
                </div>
            </div>
            <div class="container_message_send">
                <textarea jsmvcfw-elementHookName="elementInputMessageSend" name="messageSend" rows="4"></textarea>
                <div class="container_action">
                    <div class="left">
                        <button
                            onclick={() => {
                                methodObject.onClickButtonUpload();
                            }}
                        >
                            <i class="cls_icon">upload_file</i>
                        </button>
                        <button
                            class={variableObject.agentMode.state === "tool-call" ? "active" : ""}
                            onclick={() => {
                                methodObject.onClickButtonToolCall();
                            }}
                        >
                            <i class="cls_icon">construction</i>
                        </button>
                        <button
                            class={variableObject.agentMode.state === "tool-task" ? "active" : ""}
                            onclick={() => {
                                methodObject.onClickButtonToolTask();
                            }}
                        >
                            <i class="cls_icon">assignment</i>
                        </button>
                    </div>
                    <div class="right">
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
        </div>
    );
};

export default viewIndex;
