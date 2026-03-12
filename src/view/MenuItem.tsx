import { jsxFactory, IvirtualNode } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelMenuItem from "../model/MenuItem";

export const viewMenuItemLeft = (variableObject: modelMenuItem.Ivariable, methodObject: modelMenuItem.Imethod): IvirtualNode => {
    return (
        <ul class="view_menuItemLeft">
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
    );
};

export const viewMenuItemRight = (variableObject: modelMenuItem.Ivariable, methodObject: modelMenuItem.Imethod): IvirtualNode => {
    return (
        <div
            class={`view_menuItemRight ${variableObject.isMenuItemFile.state || variableObject.isMenuItemTool.state || variableObject.isMenuItemTask.state || variableObject.isMenuItemAgent.state ? "" : "none"}`}
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
                    result.push(
                        <div class="container_tool">
                            <ul>
                                {(() => {
                                    const result: IvirtualNode[] = [];

                                    for (const [key, value] of Object.entries(variableObject.toolList.state)) {
                                        result.push(
                                            <li
                                                key={key}
                                                class="chip"
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
                    );
                } else if (variableObject.isMenuItemTask.state) {
                    result.push(<p>task</p>);
                } else if (variableObject.isMenuItemAgent.state) {
                    result.push(<p>agent</p>);
                }

                return result;
            })()}
        </div>
    );
};
