import { jsxFactory, IvirtualNode } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelIndex from "../model/Index";

const viewIndex = (variableObject: modelIndex.Ivariable, methodObject: modelIndex.Imethod): IvirtualNode => {
    return (
        <div class="view_index page_container" jsmvcfw-controllerName="Index">
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
                    <ul class="menu_item">
                        <li
                            class={variableObject.isMenuItemFile.state ? "active" : ""}
                            onclick={() => {
                                methodObject.onClickMenuFile();
                            }}
                        >
                            <i class="cls_icon">file_present</i> <p>File</p>
                        </li>
                        <li
                            class={variableObject.isMenuItemTool.state ? "active" : ""}
                            onclick={() => {
                                methodObject.onClickMenuTool();
                            }}
                        >
                            <i class="cls_icon">construction</i> <p>Tool</p>
                        </li>
                        <li
                            class={variableObject.isMenuItemTask.state ? "active" : ""}
                            onclick={() => {
                                methodObject.onClickMenuTask();
                            }}
                        >
                            <i class="cls_icon">assignment</i> <p>Task</p>
                        </li>
                        <li
                            class={variableObject.isMenuItemAgent.state ? "active" : ""}
                            onclick={() => {
                                methodObject.onClickMenuAgent();
                            }}
                        >
                            <i class="cls_icon">smart_toy</i> <p>Agent</p>
                        </li>
                    </ul>
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
                        <div class={`chip no_hover ${variableObject.toolSelected.state.name ? "" : "none"}`}>
                            <p>{variableObject.toolSelected.state.name}</p>
                            <i
                                class="cls_icon close"
                                onclick={() => {
                                    methodObject.onClickToolClose();
                                }}
                            >
                                cancel
                            </i>
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
                                <div class="dropdown">
                                    <div
                                        class={`chip ${variableObject.systemMode.state === "tool-call" ? "active" : ""}`}
                                        onclick={() => {
                                            methodObject.onClickChipTool();
                                        }}
                                    >
                                        <i class="cls_icon">construction</i>
                                        <p>Tool</p>
                                    </div>
                                    <div class={`menu top-right ${variableObject.isOpenDropdownToolList.state ? "" : "none"}`}>
                                        <ul>
                                            {(() => {
                                                const result: IvirtualNode[] = [];

                                                for (const [key, value] of Object.entries(variableObject.toolList.state)) {
                                                    result.push(
                                                        <li
                                                            key={key}
                                                            onClick={() => {
                                                                methodObject.onClickToolName(value.name);
                                                            }}
                                                        >
                                                            {value.name}
                                                        </li>
                                                    );
                                                }

                                                return result;
                                            })()}
                                        </ul>
                                    </div>
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
                    <div
                        class={`container_menu_item ${variableObject.isMenuItemFile.state || variableObject.isMenuItemTool.state || variableObject.isMenuItemTask.state || variableObject.isMenuItemAgent.state ? "" : "none"}`}
                    >
                        {(() => {
                            const result: IvirtualNode[] = [];

                            if (variableObject.isMenuItemFile.state) {
                                result.push(
                                    <div class="container_file">
                                        <p class="info">The files will be available for 10 minutes from the time the upload is completed.</p>
                                        <ul>
                                            {(() => {
                                                const result: IvirtualNode[] = [];

                                                for (let a = 0; a < variableObject.fileUploadedList.state.length; a++) {
                                                    const value = variableObject.fileUploadedList.state[a];

                                                    result.push(
                                                        <li key={a} class="chip">
                                                            <i
                                                                class="cls_icon close"
                                                                onclick={() => {
                                                                    methodObject.onClickFileUploadDelete(a, value);
                                                                }}
                                                            >
                                                                delete
                                                            </i>
                                                            <p>{value}</p>
                                                        </li>
                                                    );
                                                }

                                                return result;
                                            })()}
                                        </ul>
                                    </div>
                                );
                            } else if (variableObject.isMenuItemTool.state) {
                                result.push(<p>tool</p>);
                            } else if (variableObject.isMenuItemTask.state) {
                                result.push(<p>task</p>);
                            } else if (variableObject.isMenuItemAgent.state) {
                                result.push(<p>agent</p>);
                            }

                            return result;
                        })()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default viewIndex;
