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
                        <div class="document_wrapper">
                            {(() => {
                                const result: IvirtualNode[] = [];

                                if (variableObject.isRagGraphOpen.state) {
                                    result.push(
                                        <div class="skill_wrapper">
                                            <div class="button_wrapper">
                                                <button
                                                    onClick={(event: Event) => {
                                                        methodObject.onClickRagGraphBack(event);
                                                    }}
                                                >
                                                    <p>Back</p>
                                                </button>
                                            </div>
                                            <div class="graph_wrapper"></div>
                                        </div>
                                    );
                                } else {
                                    result.push(
                                        <>
                                            <div class="button_wrapper">
                                                <button
                                                    onClick={() => {
                                                        methodObject.onClickChipDocumentUpload();
                                                    }}
                                                    disabled={variableObject.isDocumentUpload.state}
                                                >
                                                    {(() => {
                                                        const result: IvirtualNode[] = [];

                                                        if (variableObject.isDocumentUpload.state) {
                                                            result.push(<i class="cls_icon">update</i>);
                                                        } else {
                                                            result.push(
                                                                <>
                                                                    <i class="cls_icon">upload_file</i>
                                                                    <p>Upload</p>
                                                                </>
                                                            );
                                                        }

                                                        return result;
                                                    })()}
                                                </button>
                                                <button
                                                    class="rag"
                                                    onClick={() => {
                                                        methodObject.onClickChipRagStart();
                                                    }}
                                                    disabled={variableObject.isRagEmbeddingStart.state}
                                                >
                                                    {(() => {
                                                        const result: IvirtualNode[] = [];

                                                        if (variableObject.isRagEmbeddingStart.state) {
                                                            result.push(<i class="cls_icon">update</i>);
                                                        } else {
                                                            result.push(
                                                                <>
                                                                    <i class="cls_icon">storage</i>
                                                                    <p>RAG - Start</p>
                                                                </>
                                                            );
                                                        }

                                                        return result;
                                                    })()}
                                                </button>
                                                <button
                                                    class="rag"
                                                    onClick={() => {
                                                        methodObject.onClickChipRagGraph();
                                                    }}
                                                >
                                                    <i class="cls_icon">analytics</i>
                                                    <p>RAG - Graph</p>
                                                </button>
                                            </div>
                                            <div class="table_flex">
                                                <div class="row header">
                                                    <div class="cell delete"></div>
                                                    <div class="cell name">
                                                        <p>Name</p>
                                                    </div>
                                                    <div class="cell date">
                                                        <p>Date modified</p>
                                                    </div>
                                                    <div class="cell size">
                                                        <p>Size</p>
                                                    </div>
                                                    <div class="cell button"></div>
                                                </div>
                                                <div class="body">
                                                    {(() => {
                                                        const result: IvirtualNode[] = [];

                                                        for (let a = 0; a < variableObject.documentList.state.length; a++) {
                                                            const value = variableObject.documentList.state[a];
                                                            const extension = methodObject.fileExtension(value.fileName);

                                                            result.push(
                                                                <div key={a} class="row">
                                                                    <div class="cell delete">
                                                                        <i
                                                                            class="cls_icon"
                                                                            onClick={(event: Event) => {
                                                                                methodObject.onClickDocumentDelete(event, a, value.fileName);
                                                                            }}
                                                                        >
                                                                            delete
                                                                        </i>
                                                                    </div>
                                                                    <div class="cell name">
                                                                        <img class="icon" src={`/asset/image/icon_file/${extension}.svg`} />
                                                                        <p>{value.fileName}</p>
                                                                    </div>
                                                                    <div class="cell date">
                                                                        <p>{value.dateModified}</p>
                                                                    </div>
                                                                    <div class="cell size">
                                                                        <p>{value.size}</p>
                                                                    </div>
                                                                    <div class="cell button">
                                                                        <button
                                                                            onClick={() => methodObject.windowOpenDocument(value.fileName)}
                                                                            disabled={variableObject.documentOpenList.state.includes(value.fileName)}
                                                                        >
                                                                            <p>Open</p>
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }

                                                        return result;
                                                    })()}
                                                </div>
                                            </div>
                                        </>
                                    );
                                }
                                return result;
                            })()}
                        </div>
                    );
                } else if (variableObject.isMenuItemSkill.state) {
                    result.push(
                        <div class="skill_wrapper">
                            <div class="button_wrapper">
                                <button
                                    onClick={() => {
                                        methodObject.onClickChipSkillUpload();
                                    }}
                                    disabled={variableObject.isSkillUpload.state}
                                >
                                    {(() => {
                                        const result: IvirtualNode[] = [];

                                        if (variableObject.isSkillUpload.state) {
                                            result.push(<i class="cls_icon">update</i>);
                                        } else {
                                            result.push(
                                                <>
                                                    <i class="cls_icon">upload_file</i>
                                                    <p>Upload</p>
                                                </>
                                            );
                                        }

                                        return result;
                                    })()}
                                </button>
                            </div>
                            <div class="table_flex">
                                <div class="row header">
                                    <div class="cell delete"></div>
                                    <div class="cell name">
                                        <p>Name</p>
                                    </div>
                                    <div class="cell date">
                                        <p>Date modified</p>
                                    </div>
                                    <div class="cell size">
                                        <p>Size</p>
                                    </div>
                                </div>
                                <div class="body">
                                    {(() => {
                                        const result: IvirtualNode[] = [];

                                        const list = Object.entries(variableObject.skillList.state);

                                        for (const [key, value] of list) {
                                            result.push(
                                                <div key={key} class="row">
                                                    <div class="cell delete">
                                                        <i
                                                            class="cls_icon"
                                                            onClick={(event: Event) => {
                                                                methodObject.onClickSkillDelete(event, Number(key), value.fileName);
                                                            }}
                                                        >
                                                            delete
                                                        </i>
                                                    </div>
                                                    <div class="cell name">
                                                        <img class="icon" src={`/asset/image/icon_file/md.svg`} />
                                                        <p>{value.fileName}</p>
                                                    </div>
                                                    <div class="cell date">
                                                        <p>{value.dateModified}</p>
                                                    </div>
                                                    <div class="cell size">
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
                        <div class="tool_wrapper">
                            <ul>
                                {(() => {
                                    const result: IvirtualNode[] = [];

                                    for (const [key, value] of Object.entries(variableObject.toolList.state)) {
                                        result.push(
                                            <li key={key} class="chip">
                                                <div class="top">
                                                    <img src={`/asset/image/icon_ui/${value.icon}`} />
                                                    <p>{value.name}</p>
                                                    <i
                                                        class="cls_icon"
                                                        onClick={() => {
                                                            methodObject.onClickToolOpen(value.name);
                                                        }}
                                                    >
                                                        launch
                                                    </i>
                                                </div>
                                                <p class="bottom">{value.description}</p>
                                                <p class="label">Example:</p>
                                                <p class="bottom">{value.example}</p>
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
                        <div class="task_wrapper">
                            <ul>
                                {(() => {
                                    const result: IvirtualNode[] = [];

                                    for (const [key, value] of Object.entries(variableObject.taskList.state)) {
                                        result.push(
                                            <li key={key} class="chip">
                                                <div class="top">
                                                    <img src={`/asset/image/icon_ui/${value.icon}`} />
                                                    <p>{value.name}</p>
                                                    <i
                                                        class="cls_icon"
                                                        onClick={() => {
                                                            methodObject.onClickTaskOpen(value.name);
                                                        }}
                                                    >
                                                        launch
                                                    </i>
                                                </div>
                                                <p class="bottom">{value.description}</p>
                                                <p class="label">Example:</p>
                                                <p class="bottom">{value.example}</p>
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
                        <div class="agent_wrapper">
                            {(() => {
                                const result: IvirtualNode[] = [];

                                if (variableObject.isAgentSkillSelect.state) {
                                    result.push(
                                        <div class="skill_wrapper">
                                            <div class="button_wrapper">
                                                <button
                                                    onClick={(event: Event) => {
                                                        methodObject.onClickSelectSkillBack(event);
                                                    }}
                                                >
                                                    <p>Back</p>
                                                </button>
                                            </div>
                                            <div class="table_flex">
                                                <div class="row header">
                                                    <div class="cell name">
                                                        <p>Name</p>
                                                    </div>
                                                    <div class="cell date">
                                                        <p>Date modified</p>
                                                    </div>
                                                    <div class="cell size">
                                                        <p>Size</p>
                                                    </div>
                                                    <div class="cell button"></div>
                                                </div>
                                                <div class="body">
                                                    {(() => {
                                                        const result: IvirtualNode[] = [];

                                                        const list = Object.entries(variableObject.skillList.state);

                                                        for (const [key, value] of list) {
                                                            result.push(
                                                                <div key={key} class="row">
                                                                    <div class="cell name">
                                                                        <img class="icon" src={`/asset/image/icon_file/md.svg`} />
                                                                        <p>{value.fileName}</p>
                                                                    </div>
                                                                    <div class="cell date">
                                                                        <p>{value.dateModified}</p>
                                                                    </div>
                                                                    <div class="cell size">
                                                                        <p>{value.size}</p>
                                                                    </div>
                                                                    <div class="cell button">
                                                                        <button
                                                                            onClick={(event: Event) => {
                                                                                methodObject.onClickSkillSelect(event, value.fileName);
                                                                            }}
                                                                        >
                                                                            <p>Select</p>
                                                                        </button>
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
                                                <div class="select_wrapper">
                                                    <button
                                                        onClick={(event: Event) => {
                                                            methodObject.onClickSelectSkill(event);
                                                        }}
                                                    >
                                                        <p>Apply</p>
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
                                            <div class="form_button_wrapper">
                                                <button
                                                    onClick={(event: Event) => {
                                                        methodObject.onClickAgentSave(event);
                                                    }}
                                                    disabled={variableObject.isAgentSave.state}
                                                >
                                                    {(() => {
                                                        const result: IvirtualNode[] = [];

                                                        if (variableObject.isAgentSave.state) {
                                                            result.push(<i class="cls_icon">update</i>);
                                                        } else {
                                                            result.push(<p>Save</p>);
                                                        }

                                                        return result;
                                                    })()}
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
                                            <div class="button_wrapper">
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
                                                            <li key={key} class="chip agent">
                                                                <div class="top">
                                                                    <img src={`/asset/image/icon_ui/agent.svg`} />
                                                                    <p>{value.name}</p>
                                                                    <i
                                                                        class="cls_icon"
                                                                        onClick={() => {
                                                                            methodObject.onClickAgentOpen(value.id);
                                                                        }}
                                                                    >
                                                                        launch
                                                                    </i>
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
