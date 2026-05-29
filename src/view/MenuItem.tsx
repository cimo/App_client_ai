import { jsxFactory, jsxFragment, IvirtualNode } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelMenuItem from "../model/MenuItem";

export const left = (variableObject: modelMenuItem.Ivariable, methodObject: modelMenuItem.Imethod): IvirtualNode => {
    return (
        <ul class="view_menuItem_left">
            <li
                class={variableObject.isMenuItemDocument.state ? "active" : ""}
                onClick={(event: Event) => {
                    methodObject.onClickMenuDocument(event);
                }}
            >
                <i class="cls_icon">file_present</i> <p>Document</p>
            </li>
            <li
                class={variableObject.isMenuItemSkill.state ? "active" : ""}
                onClick={(event: Event) => {
                    methodObject.onClickMenuSkill(event);
                }}
            >
                <i class="cls_icon">lightbulb</i> <p>Skill</p>
            </li>
            <li
                class={variableObject.isMenuItemTool.state ? "active" : ""}
                onClick={(event: Event) => {
                    methodObject.onClickMenuTool(event);
                }}
            >
                <i class="cls_icon">construction</i> <p>Tool</p>
            </li>
            <li
                class={variableObject.isMenuItemTask.state ? "active" : ""}
                onClick={(event: Event) => {
                    methodObject.onClickMenuTask(event);
                }}
            >
                <i class="cls_icon">assignment</i> <p>Task</p>
            </li>
            <li
                class={variableObject.isMenuItemAgent.state ? "active" : ""}
                onClick={(event: Event) => {
                    methodObject.onClickMenuAgent(event);
                }}
            >
                <i class="cls_icon">smart_toy</i> <p>Agent</p>
            </li>
        </ul>
    );
};

export const right = (variableObject: modelMenuItem.Ivariable, methodObject: modelMenuItem.Imethod): IvirtualNode => {
    return (
        <div
            class={`view_menuItem_right ${variableObject.isMenuItemDocument.state || variableObject.isMenuItemTool.state || variableObject.isMenuItemTask.state || variableObject.isMenuItemAgent.state || variableObject.isMenuItemSkill.state ? "" : "none"}`}
        >
            {(() => {
                const result: IvirtualNode[] = [];

                if (variableObject.isMenuItemDocument.state) {
                    result.push(
                        <div class="document_container">
                            <div class="button_container">
                                <button
                                    onClick={() => {
                                        methodObject.onClickChipDocumentUpload();
                                    }}
                                >
                                    <i class="cls_icon">upload_file</i>
                                    <p>Upload</p>
                                </button>
                            </div>
                            {(() => {
                                const result: IvirtualNode[] = [];

                                result.push(
                                    <div class="upload_status">
                                        {(() => {
                                            const result: IvirtualNode[] = [];

                                            if (variableObject.isDocumentUploading.state) {
                                                result.push(<i class="cls_icon">update</i>);
                                            } else if (variableObject.documentUploadStatusList.state.length > 0) {
                                                result.push(
                                                    <details key="0" open>
                                                        <summary>
                                                            <p>Upload result:</p>
                                                        </summary>
                                                        <ul class="file">
                                                            {(() => {
                                                                const result: IvirtualNode[] = [];

                                                                for (const [key, value] of Object.entries(
                                                                    variableObject.documentUploadStatusList.state
                                                                )) {
                                                                    if (value.status !== "" && value.fileName !== "") {
                                                                        result.push(
                                                                            <li key={`upload_${key}`}>
                                                                                <i class="cls_icon">file_present</i>
                                                                                <p>
                                                                                    [{value.status}] {value.fileName}
                                                                                </p>
                                                                            </li>
                                                                        );
                                                                    }
                                                                }

                                                                return result;
                                                            })()}
                                                        </ul>
                                                    </details>
                                                );
                                            }

                                            if (variableObject.documentEmbeddingStatusList.state.length > 0) {
                                                result.push(
                                                    <details key="1" open>
                                                        <summary>
                                                            <p>Embedding result:</p>
                                                        </summary>
                                                        <ul class="embedding">
                                                            {(() => {
                                                                const result: IvirtualNode[] = [];

                                                                for (const [key, value] of Object.entries(
                                                                    variableObject.documentEmbeddingStatusList.state
                                                                )) {
                                                                    if (value.status !== "" && value.fileName !== "") {
                                                                        result.push(
                                                                            <li key={`embedding_${key}`}>
                                                                                <i class="cls_icon">storage</i>
                                                                                <p>
                                                                                    [{value.status}] {value.fileName}
                                                                                </p>
                                                                            </li>
                                                                        );
                                                                    }
                                                                }

                                                                return result;
                                                            })()}
                                                        </ul>
                                                    </details>
                                                );
                                            }

                                            return result;
                                        })()}
                                    </div>
                                );

                                return result;
                            })()}
                            <div class="table_flex">
                                <div class="row header">
                                    <div class="cell icon_delete"></div>
                                    <div class="cell">
                                        <p>Name</p>
                                    </div>
                                    <div class="cell">
                                        <p>Date modified</p>
                                    </div>
                                    <div class="cell">
                                        <p>Size</p>
                                    </div>
                                </div>
                                <div class="list_container">
                                    {(() => {
                                        const result: IvirtualNode[] = [];

                                        const list = Object.entries(variableObject.documentList.state);

                                        for (const [key, value] of list) {
                                            const extension = methodObject.fileExtension(value.fileName);

                                            result.push(
                                                <div key={key} class="row">
                                                    <div class="cell icon_delete">
                                                        <i
                                                            class="cls_icon"
                                                            onClick={(event: Event) => {
                                                                methodObject.onClickDocumentDelete(event, Number(key), value.fileName);
                                                            }}
                                                        >
                                                            delete
                                                        </i>
                                                    </div>
                                                    <div class="cell name" onClick={() => methodObject.openDocument(value.fileName)}>
                                                        <img class="icon" src={`/asset/image/icon_file/${extension}.svg`} />
                                                        <p>{value.fileName}</p>
                                                    </div>
                                                    <div class="cell">
                                                        <p>{value.dateModified}</p>
                                                    </div>
                                                    <div class="cell">
                                                        <p>{value.size}</p>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        return result;
                                    })()}
                                </div>
                            </div>
                        </div>
                    );
                } else if (variableObject.isMenuItemSkill.state) {
                    result.push(
                        <div class="skill_container">
                            <div class="button_container">
                                <button
                                    onClick={() => {
                                        methodObject.onClickChipSkillUpload();
                                    }}
                                >
                                    <i class="cls_icon">upload_file</i>
                                    <p>Upload</p>
                                </button>
                            </div>
                            {(() => {
                                const result: IvirtualNode[] = [];

                                result.push(
                                    <div class="upload_status">
                                        {(() => {
                                            const result: IvirtualNode[] = [];
                                            if (variableObject.isSkillUploading.state) {
                                                result.push(<i class="cls_icon">update</i>);
                                            } else if (variableObject.skillUploadStatusList.state.length > 0) {
                                                result.push(
                                                    <details open>
                                                        <summary>
                                                            <p>Upload result:</p>
                                                        </summary>
                                                        <ul class="file">
                                                            {(() => {
                                                                const result: IvirtualNode[] = [];

                                                                for (const [key, value] of Object.entries(
                                                                    variableObject.skillUploadStatusList.state
                                                                )) {
                                                                    if (value.status !== "" || value.fileName !== "") {
                                                                        result.push(
                                                                            <li key={key}>
                                                                                <i class="cls_icon">file_present</i>
                                                                                <p>
                                                                                    [{value.status}] {value.fileName}
                                                                                </p>
                                                                            </li>
                                                                        );
                                                                    }
                                                                }

                                                                return result;
                                                            })()}
                                                        </ul>
                                                    </details>
                                                );
                                            }

                                            return result;
                                        })()}
                                    </div>
                                );

                                return result;
                            })()}
                            <div class="table_flex">
                                <div class="row header">
                                    <div class="cell icon_delete"></div>
                                    <div class="cell">
                                        <p>Name</p>
                                    </div>
                                    <div class="cell">
                                        <p>Date modified</p>
                                    </div>
                                    <div class="cell">
                                        <p>Size</p>
                                    </div>
                                </div>
                                <div class="list_container">
                                    {(() => {
                                        const result: IvirtualNode[] = [];

                                        const list = Object.entries(variableObject.skillList.state);

                                        for (const [key, value] of list) {
                                            result.push(
                                                <div key={key} class="row">
                                                    <div class="cell icon_delete">
                                                        <i
                                                            class="cls_icon"
                                                            onClick={(event: Event) => {
                                                                methodObject.onClickSkillDelete(event, Number(key), value.fileName);
                                                            }}
                                                        >
                                                            delete
                                                        </i>
                                                    </div>
                                                    <div class="cell name skill">
                                                        <img class="icon" src={`/asset/image/icon_file/md.svg`} />
                                                        <p>{value.fileName}</p>
                                                    </div>
                                                    <div class="cell">
                                                        <p>{value.dateModified}</p>
                                                    </div>
                                                    <div class="cell">
                                                        <p>{value.size}</p>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        return result;
                                    })()}
                                </div>
                            </div>
                        </div>
                    );
                } else if (variableObject.isMenuItemTool.state) {
                    result.push(
                        <div class="tool_container">
                            <ul>
                                {(() => {
                                    const result: IvirtualNode[] = [];

                                    for (const [key, value] of Object.entries(variableObject.toolList.state)) {
                                        result.push(
                                            <li
                                                key={key}
                                                class="chip"
                                                onClick={() => {
                                                    methodObject.onClickTool(value.name);
                                                }}
                                            >
                                                <div class="top">
                                                    <img src={`/asset/image/icon_ui/${value.icon}`} />
                                                    <p>{value.name}</p>
                                                </div>
                                                <p class="bottom">{value.description}</p>
                                            </li>
                                        );
                                    }

                                    return result;
                                })()}
                            </ul>
                        </div>
                    );
                } else if (variableObject.isMenuItemTask.state) {
                    result.push(
                        <div class="task_container">
                            <ul>
                                {(() => {
                                    const result: IvirtualNode[] = [];

                                    for (const [key, value] of Object.entries(variableObject.taskList.state)) {
                                        result.push(
                                            <li
                                                key={key}
                                                class="chip"
                                                onClick={() => {
                                                    methodObject.onClickTask(value.name);
                                                }}
                                            >
                                                <div class="top">
                                                    <img src={`/asset/image/icon_ui/${value.icon}`} />
                                                    <p>{value.name}</p>
                                                </div>
                                                <p class="bottom">{value.description}</p>
                                            </li>
                                        );
                                    }

                                    return result;
                                })()}
                            </ul>
                        </div>
                    );
                } else if (variableObject.isMenuItemAgent.state) {
                    result.push(
                        <div class="agent_container">
                            {(() => {
                                const result: IvirtualNode[] = [];

                                if (variableObject.isAgentSelectSkill.state) {
                                    result.push(
                                        <div class="skill_container">
                                            <div class="button_container">
                                                <button
                                                    onClick={(event: Event) => {
                                                        methodObject.onClickSelectSkillCancel(event);
                                                    }}
                                                >
                                                    <p>Back</p>
                                                </button>
                                            </div>
                                            <div class="table_flex">
                                                <div class="row header">
                                                    <div class="cell">
                                                        <p>Name</p>
                                                    </div>
                                                    <div class="cell">
                                                        <p>Date modified</p>
                                                    </div>
                                                    <div class="cell">
                                                        <p>Size</p>
                                                    </div>
                                                </div>
                                                <div class="list_container">
                                                    {(() => {
                                                        const result: IvirtualNode[] = [];

                                                        const list = Object.entries(variableObject.skillList.state);

                                                        for (const [key, value] of list) {
                                                            result.push(
                                                                <div key={key} class="row">
                                                                    <div
                                                                        class="cell name"
                                                                        onClick={(event: Event) => {
                                                                            methodObject.onClickSkillItem(event, value.fileName);
                                                                        }}
                                                                    >
                                                                        <img class="icon" src={`/asset/image/icon_file/md.svg`} />
                                                                        <p>{value.fileName}</p>
                                                                    </div>
                                                                    <div class="cell">
                                                                        <p>{value.dateModified}</p>
                                                                    </div>
                                                                    <div class="cell">
                                                                        <p>{value.size}</p>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }

                                                        return result;
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                } else if (Object.keys(variableObject.agentForm.state).length > 0) {
                                    result.push(
                                        <div class="agent_form">
                                            <div class="form_field">
                                                <p>Name:</p>
                                                <textarea jsmvcfw-elementHookName="elementInputAgentName" rows="1">
                                                    {variableObject.agentForm.state.name}
                                                </textarea>
                                            </div>
                                            <div class="form_field">
                                                <p>Description:</p>
                                                <textarea jsmvcfw-elementHookName="elementInputAgentDescription" rows="4">
                                                    {variableObject.agentForm.state.description}
                                                </textarea>
                                            </div>
                                            <div class="form_field">
                                                <p>Skill:</p>
                                                <div class="select_container">
                                                    <button
                                                        onClick={(event: Event) => {
                                                            methodObject.onClickSelectSkill(event);
                                                        }}
                                                    >
                                                        <p>Select</p>
                                                    </button>
                                                    {(() => {
                                                        const result: IvirtualNode[] = [];

                                                        if (variableObject.agentForm.state.skill !== "") {
                                                            result.push(
                                                                <div class="skill">
                                                                    <img src={`/asset/image/icon_ui/lightbulb.svg`} />
                                                                    <p>{variableObject.agentForm.state.skill}</p>
                                                                </div>
                                                            );
                                                        }

                                                        return result;
                                                    })()}
                                                </div>
                                            </div>
                                            <div class="form_message">
                                                <p>{variableObject.agentFormResult.state}</p>
                                            </div>
                                            <div class="form_button_container">
                                                <button
                                                    onClick={(event: Event) => {
                                                        methodObject.onClickAgentSave(event);
                                                    }}
                                                >
                                                    <p>Save</p>
                                                </button>
                                                <button
                                                    onClick={(event: Event) => {
                                                        methodObject.onClickAgentCancel(event);
                                                    }}
                                                >
                                                    <p>Cancel</p>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                } else {
                                    result.push(
                                        <>
                                            <div class="button_container">
                                                <button
                                                    onClick={(event: Event) => {
                                                        methodObject.onClickAgentCreate(event);
                                                    }}
                                                >
                                                    <i class="cls_icon">add</i>
                                                    <p>Create</p>
                                                </button>
                                            </div>
                                            <ul>
                                                {(() => {
                                                    const result: IvirtualNode[] = [];

                                                    const list = Object.entries(variableObject.agentList.state);

                                                    for (const [key, value] of list) {
                                                        result.push(
                                                            <li
                                                                key={key}
                                                                class="chip"
                                                                onClick={() => {
                                                                    methodObject.onClickAgent(value.id);
                                                                }}
                                                            >
                                                                <div class="top">
                                                                    <img src={`/asset/image/icon_ui/agent.svg`} />
                                                                    <p>{value.name}</p>
                                                                    <i
                                                                        class="cls_icon"
                                                                        onClick={(event: Event) => {
                                                                            methodObject.onClickAgentEdit(event, value.id);
                                                                        }}
                                                                    >
                                                                        edit
                                                                    </i>
                                                                    <i
                                                                        class="cls_icon"
                                                                        onClick={(event: Event) => {
                                                                            methodObject.onClickAgentDelete(event, Number(key), value.id, value.name);
                                                                        }}
                                                                    >
                                                                        delete
                                                                    </i>
                                                                </div>
                                                                <p class="bottom">{value.description}</p>
                                                                {(() => {
                                                                    const result: IvirtualNode[] = [];

                                                                    if (value.skill !== "") {
                                                                        result.push(
                                                                            <div class="skill">
                                                                                <img src={`/asset/image/icon_ui/lightbulb.svg`} />
                                                                                <p>{value.skill}</p>
                                                                            </div>
                                                                        );
                                                                    }

                                                                    return result;
                                                                })()}
                                                            </li>
                                                        );
                                                    }

                                                    return result;
                                                })()}
                                            </ul>
                                        </>
                                    );
                                }

                                return result;
                            })()}
                        </div>
                    );
                }

                return result;
            })()}
        </div>
    );
};
