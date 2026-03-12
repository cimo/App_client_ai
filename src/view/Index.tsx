import { jsxFactory, IvirtualNode } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelIndex from "../model/Index";

const viewIndex = (variableObject: modelIndex.Ivariable, methodObject: modelIndex.Imethod): IvirtualNode => {
    return (
        <div class="view_index" jsmvcfw-controllerName="Index">
            <aside jsmvcfw-controllerName="Ai" />
            <aside jsmvcfw-controllerName="Mcp" />
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
            <div class="container_content">
                <div class="container_left">
                    <aside jsmvcfw-controllerName="MenuItem" view="viewMenuItemLeft" />
                </div>
                <div class="container_right">
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
                            <div class={`menu bottom-left ${variableObject.isOpenDropdownModelList.state ? "" : "none"}`}>
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
                    <div class="container_chat" jsmvcfw-elementHookName="elementContainerMessageReceive">
                        {(() => {
                            const result: IvirtualNode[] = [];

                            for (const [key, value] of Object.entries(variableObject.chatMessageList.state)) {
                                result.push(
                                    <div key={key}>
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
                                                    result.push(<i class="cls_icon">update</i>);
                                                } else {
                                                    result.push(<pre>{value.assistantNoReason}</pre>);
                                                }

                                                return result;
                                            })()}
                                            <ul class={`file ${value.file ? "" : "none"}`}>
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
                                        </div>
                                    </div>
                                );
                            }

                            return result;
                        })()}
                        <div class="bottom_limit" jsmvcfw-elementHookName="elementBottomLimit"></div>
                    </div>
                    <div class="container_chip">
                        <div class={`chip ${variableObject.toolSelected.state.name ? "" : "none"}`}>
                            <i
                                class="cls_icon close"
                                onclick={() => {
                                    //methodObject.onClickToolClose();
                                }}
                            >
                                cancel
                            </i>
                            <p>{variableObject.toolSelected.state.name}</p>
                        </div>
                    </div>
                    <div class="container_message_send">
                        <textarea jsmvcfw-elementHookName="elementInputMessageSend" name="messageSend" rows="4"></textarea>
                        <div class="container_action">
                            <div class="left">
                                <div
                                    class="chip"
                                    onclick={() => {
                                        methodObject.onClickChipUpload();
                                    }}
                                >
                                    <i class="cls_icon">upload_file</i>
                                    <p>Upload</p>
                                </div>
                                <div
                                    class={`chip ${variableObject.systemMode.state === "tool-task" ? "active" : ""}`}
                                    onclick={() => {
                                        methodObject.onClickChipTask();
                                    }}
                                >
                                    <i class="cls_icon">assignment</i>
                                    <p>Task</p>
                                </div>
                            </div>
                            <div class="right">
                                <button
                                    onclick={() => {
                                        methodObject.onClickButtonMessageSend();
                                    }}
                                >
                                    <i class="cls_icon">{variableObject.isMessageSent.state ? "stop" : "play_arrow"}</i>
                                </button>
                            </div>
                        </div>
                    </div>
                    <aside jsmvcfw-controllerName="MenuItem" view="viewMenuItemRight" />
                </div>
            </div>
        </div>
    );
};

export default viewIndex;
