import { jsxFactory, jsxFragment, IvirtualNode } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelMenuItem from "../model/MenuItem";

export const left = (variableObject: modelMenuItem.Ivariable, methodObject: modelMenuItem.Imethod): IvirtualNode => {
    return (
        <ul class="view_menuItem_left">
            <li
                class={variableObject.isMenuItemDocument.state ? "active" : ""}
                onClick={() => {
                    methodObject.onClickMenuDocument();
                }}
            >
                <i class="cls_icon">file_present</i> <p>Document</p>
            </li>
            <li
                class={variableObject.isMenuItemSkill.state ? "active" : ""}
                onClick={() => {
                    methodObject.onClickMenuSkill();
                }}
            >
                <i class="cls_icon">lightbulb</i> <p>Skill</p>
            </li>
            <li
                class={variableObject.isMenuItemTool.state ? "active" : ""}
                onClick={() => {
                    methodObject.onClickMenuTool();
                }}
            >
                <i class="cls_icon">construction</i> <p>Tool</p>
            </li>
            <li
                class={variableObject.isMenuItemTask.state ? "active" : ""}
                onClick={() => {
                    methodObject.onClickMenuTask();
                }}
            >
                <i class="cls_icon">assignment</i> <p>Task</p>
            </li>
            <li
                class={variableObject.isMenuItemAgent.state ? "active" : ""}
                onClick={() => {
                    methodObject.onClickMenuAgent();
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
                            {(() => {
                                const result: IvirtualNode[] = [];

                                result.push(
                                    <div class="status_container">
                                        {(() => {
                                            const result: IvirtualNode[] = [];

                                            if (variableObject.isDocumentUploading.state) {
                                                result.push(<i class="cls_icon">update</i>);
                                            } else if (variableObject.documentUploadStatusList.state.length > 0) {
                                                result.push(
                                                    <details key="documentUploadStatus" open>
                                                        <summary>
                                                            <p>Upload result:</p>
                                                        </summary>
                                                        <ul key="documentUploadStatusList" class="file">
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
                                                    <details key="documentEmbeddingStatus" open>
                                                        <summary>
                                                            <p>Embedding result:</p>
                                                        </summary>
                                                        <ul key="documentEmbeddingStatusList" class="embedding">
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
                            <div
                                class="chip"
                                onClick={() => {
                                    methodObject.onClickChipDocumentUpload();
                                }}
                            >
                                <i class="cls_icon">upload_file</i>
                                <p>Upload</p>
                            </div>
                            <ul>
                                {(() => {
                                    const result: IvirtualNode[] = [];

                                    for (let a = 0; a < variableObject.documentList.state.length; a++) {
                                        const value = variableObject.documentList.state[a];

                                        result.push(
                                            <li key={a} class="chip" onClick={() => methodObject.openDocument(value)}>
                                                <i
                                                    class="cls_icon close"
                                                    onClick={(event: Event) => {
                                                        methodObject.onClickDocumentDelete(event, a, value);
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
                } else if (variableObject.isMenuItemSkill.state) {
                    result.push(
                        <div class="skill_container">
                            {(() => {
                                const result: IvirtualNode[] = [];

                                if (variableObject.isSkillUploading.state) {
                                    result.push(<i class="cls_icon">update</i>);
                                } else if (variableObject.skillUploadStatusList.state.length > 0) {
                                    result.push(
                                        <div class="status_container">
                                            <details key="skillUploadStatusList" open>
                                                <summary>
                                                    <p>Upload result:</p>
                                                </summary>
                                                <ul class="file">
                                                    {(() => {
                                                        const result: IvirtualNode[] = [];

                                                        for (const [key, value] of Object.entries(variableObject.skillUploadStatusList.state)) {
                                                            if (value.status !== "" && value.fileName !== "") {
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
                                        </div>
                                    );
                                }

                                return result;
                            })()}
                            <div
                                class="chip"
                                onClick={() => {
                                    methodObject.onClickChipSkillUpload();
                                }}
                            >
                                <i class="cls_icon">upload_file</i>
                                <p>Upload</p>
                            </div>
                            <ul>
                                {(() => {
                                    const result: IvirtualNode[] = [];

                                    for (let a = 0; a < variableObject.skillList.state.length; a++) {
                                        const value = variableObject.skillList.state[a];

                                        result.push(
                                            <li key={a} class="chip">
                                                <i
                                                    class="cls_icon close"
                                                    onClick={(event: Event) => {
                                                        methodObject.onClickSkillDelete(event, a, value);
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
                                                    <img src={`/asset/image/${value.icon}`} />
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
                                                    <img src={`/asset/image/${value.icon}`} />
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
                                            <div class="form_button_container">
                                                <div
                                                    class="chip"
                                                    onClick={(event: Event) => {
                                                        methodObject.onClickSelectSkillCancel(event);
                                                    }}
                                                >
                                                    <p>Cancel</p>
                                                </div>
                                            </div>
                                            <ul>
                                                {(() => {
                                                    const result: IvirtualNode[] = [];

                                                    for (let a = 0; a < variableObject.skillList.state.length; a++) {
                                                        const value = variableObject.skillList.state[a];

                                                        result.push(
                                                            <li
                                                                key={a}
                                                                class="chip"
                                                                onClick={(event: Event) => {
                                                                    methodObject.onClickSkillItem(event, value);
                                                                }}
                                                            >
                                                                <i class="cls_icon">lightbulb</i>
                                                                <p>{value}</p>
                                                            </li>
                                                        );
                                                    }

                                                    return result;
                                                })()}
                                            </ul>
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
                                                    <div
                                                        class="chip"
                                                        onClick={(event: Event) => {
                                                            methodObject.onClickSelectSkill(event);
                                                        }}
                                                    >
                                                        <p>Select</p>
                                                    </div>
                                                    {(() => {
                                                        const result: IvirtualNode[] = [];

                                                        if (variableObject.agentForm.state.skill !== "") {
                                                            result.push(
                                                                <div class="skill_selected">
                                                                    <i class="cls_icon">lightbulb</i>
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
                                                <div
                                                    class="chip"
                                                    onClick={(event: Event) => {
                                                        methodObject.onClickAgentSave(event);
                                                    }}
                                                >
                                                    <p>Save</p>
                                                </div>
                                                <div
                                                    class="chip"
                                                    onClick={(event: Event) => {
                                                        methodObject.onClickAgentCancel(event);
                                                    }}
                                                >
                                                    <p>Cancel</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                } else {
                                    result.push(
                                        <>
                                            <div
                                                class="chip create"
                                                onClick={(event: Event) => {
                                                    methodObject.onClickAgentCreate(event);
                                                }}
                                            >
                                                <i class="cls_icon">add</i>
                                                <p>Create</p>
                                            </div>
                                            <ul>
                                                {(() => {
                                                    const result: IvirtualNode[] = [];

                                                    for (let a = 0; a < variableObject.agentList.state.length; a++) {
                                                        const value = variableObject.agentList.state[a];

                                                        result.push(
                                                            <li
                                                                key={a}
                                                                class="chip"
                                                                onClick={() => {
                                                                    methodObject.onClickAgent(value.id);
                                                                }}
                                                            >
                                                                <div class="top">
                                                                    <i
                                                                        class="cls_icon"
                                                                        onClick={(event: Event) => {
                                                                            methodObject.onClickAgentEdit(event, value.id);
                                                                        }}
                                                                    >
                                                                        polymer
                                                                    </i>
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
                                                                            methodObject.onClickAgentDelete(event, a, value.id);
                                                                        }}
                                                                    >
                                                                        delete
                                                                    </i>
                                                                </div>
                                                                <p class="bottom">{value.description}</p>
                                                                <div class="skill">
                                                                    <i class="cls_icon">lightbulb</i>
                                                                    <p>{value.skill}</p>
                                                                </div>
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
