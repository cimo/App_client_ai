import { jsxFactory, jsxFragment, IvirtualNode } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as helperSrc from "../HelperSrc";
import * as modelMenuItem from "../model/MenuItem";

export const left = (variableObject: modelMenuItem.Ivariable, methodObject: modelMenuItem.Imethod): IvirtualNode => {
    return (
        <ul class="view_menuItem_left">
            <li
                class={() => (variableObject.isMenuItemDocument.state ? "active" : "")}
                onClick={() => {
                    methodObject.onClickMenuDocument();
                }}
            >
                <i class="cls_icon">file_present</i> <p>Document</p>
            </li>
            <li
                class={() => (variableObject.isMenuItemSkill.state ? "active" : "")}
                onClick={() => {
                    methodObject.onClickMenuSkill();
                }}
            >
                <i class="cls_icon">lightbulb</i> <p>Skill</p>
            </li>
            <li
                class={() => (variableObject.isMenuItemTool.state ? "active" : "")}
                onClick={() => {
                    methodObject.onClickMenuTool();
                }}
            >
                <i class="cls_icon">construction</i> <p>Tool</p>
            </li>
            <li
                class={() => (variableObject.isMenuItemTask.state ? "active" : "")}
                onClick={() => {
                    methodObject.onClickMenuTask();
                }}
            >
                <i class="cls_icon">assignment</i> <p>Task</p>
            </li>
            <li
                class={() => (variableObject.isMenuItemAgent.state ? "active" : "")}
                onClick={() => {
                    methodObject.onClickMenuAgent();
                }}
            >
                <i class="cls_icon">smart_toy</i> <p>Agent</p>
            </li>
            <li
                class={() => (variableObject.isMenuItemUser.state ? "active" : "")}
                onClick={() => {
                    methodObject.onClickMenuUser();
                }}
            >
                <i class="cls_icon">account_circle</i> <p>User</p>
            </li>
            <li
                class={() => (variableObject.isMenuItemSetting.state ? "active" : "")}
                onClick={() => {
                    methodObject.onClickMenuSetting();
                }}
            >
                <i class="cls_icon">settings</i> <p>Setting</p>
            </li>
        </ul>
    );
};

export const right = (variableObject: modelMenuItem.Ivariable, methodObject: modelMenuItem.Imethod): IvirtualNode => {
    return (
        <div
            class={() =>
                `view_menuItem_right ${variableObject.isMenuItemDocument.state || variableObject.isMenuItemTool.state || variableObject.isMenuItemTask.state || variableObject.isMenuItemAgent.state || variableObject.isMenuItemSkill.state || variableObject.isMenuItemUser.state || variableObject.isMenuItemSetting.state ? "" : "none"}`
            }
        >
            {() => {
                const resultList: IvirtualNode[] = [];

                if (variableObject.isMenuItemDocument.state) {
                    resultList.push(
                        <div class="document_wrapper">
                            {() => {
                                const resultList: IvirtualNode[] = [];

                                if (!variableObject.isRagGraphOpen.state) {
                                    resultList.push(
                                        <>
                                            <div class="button_wrapper">
                                                <button
                                                    onClick={() => {
                                                        methodObject.onClickDocumentUpload();
                                                    }}
                                                    disabled={() => variableObject.isDocumentUpload.state}
                                                >
                                                    {() => {
                                                        const resultList: IvirtualNode[] = [];

                                                        if (variableObject.isDocumentUpload.state) {
                                                            resultList.push(<i class="cls_icon">update</i>);
                                                        } else {
                                                            resultList.push(
                                                                <>
                                                                    <i class="cls_icon">upload_file</i>
                                                                    <p>Upload</p>
                                                                </>
                                                            );
                                                        }

                                                        return resultList;
                                                    }}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        methodObject.onClickRagStart();
                                                    }}
                                                    disabled={() => variableObject.isRagEmbeddingStart.state}
                                                >
                                                    {() => {
                                                        const resultList: IvirtualNode[] = [];

                                                        if (variableObject.isRagEmbeddingStart.state) {
                                                            resultList.push(<i class="cls_icon">update</i>);
                                                        } else {
                                                            resultList.push(
                                                                <>
                                                                    <i class="cls_icon">storage</i>
                                                                    <p>RAG - Start</p>
                                                                </>
                                                            );
                                                        }

                                                        return resultList;
                                                    }}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        methodObject.onClickRagGraph();
                                                    }}
                                                >
                                                    <i class="cls_icon">analytics</i>
                                                    <p>RAG - Graph</p>
                                                </button>
                                                {() => {
                                                    const result: IvirtualNode[] = [];

                                                    if (variableObject.documentSelectList.state.length > 0) {
                                                        result.push(
                                                            <button
                                                                class="delete_selected"
                                                                onClick={() => {
                                                                    methodObject.onClickDocumentDeleteSelected();
                                                                }}
                                                            >
                                                                <i class="cls_icon">delete</i>
                                                                <p>Delete selected</p>
                                                            </button>
                                                        );
                                                    }

                                                    return result;
                                                }}
                                            </div>
                                            <div class="table_flex">
                                                <div class="row header">
                                                    <div class="cell select"></div>
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
                                                    {() => {
                                                        const resultList: IvirtualNode[] = [];

                                                        for (const [key, value] of Object.entries(variableObject.documentList.state)) {
                                                            const extension = helperSrc.fileDetail(value.fileName).extension;

                                                            resultList.push(
                                                                <div key={key} class="row">
                                                                    <div class="cell select">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={() =>
                                                                                variableObject.documentSelectList.state.includes(value.fileName)
                                                                            }
                                                                            onChange={() => {
                                                                                methodObject.onClickDocumentCheckbox(value.fileName);
                                                                            }}
                                                                        />
                                                                    </div>
                                                                    <div class="cell delete">
                                                                        <i
                                                                            class="cls_icon"
                                                                            onClick={() => {
                                                                                methodObject.onClickDocumentDelete(value.fileName);
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
                                                                        <p>{helperSrc.localeFormat(new Date(value.dateModified))}</p>
                                                                    </div>
                                                                    <div class="cell size">
                                                                        <p>{value.size}</p>
                                                                    </div>
                                                                    <div class="cell button">
                                                                        <button
                                                                            onClick={() => methodObject.windowOpenDocument(value.fileName)}
                                                                            disabled={() =>
                                                                                variableObject.documentOpenList.state.includes(value.fileName)
                                                                            }
                                                                        >
                                                                            <p>Open</p>
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }

                                                        return resultList;
                                                    }}
                                                </div>
                                            </div>
                                            <aside jsmvcfw-controllerName="Pagination" jsmvcfw-parentView="right" />
                                        </>
                                    );
                                } else {
                                    resultList.push(
                                        <>
                                            <div class="button_wrapper">
                                                <button
                                                    onClick={() => {
                                                        methodObject.onClickRagGraphBack();
                                                    }}
                                                >
                                                    <p>Back</p>
                                                </button>
                                            </div>
                                            <div class="ragGraphify_wrapper">
                                                {() => {
                                                    const resultList: IvirtualNode[] = [];

                                                    if (variableObject.ragGraphHtml.state !== "ko") {
                                                        if (variableObject.isRagGraphHtmlLoading.state) {
                                                            resultList.push(
                                                                <div class="loading_wrapper">
                                                                    <i class="cls_icon">update</i>
                                                                </div>
                                                            );
                                                        } else {
                                                            resultList.push(
                                                                <iframe
                                                                    srcdoc={() => variableObject.ragGraphHtml.state}
                                                                    sandbox="allow-scripts"
                                                                ></iframe>
                                                            );
                                                        }
                                                    }

                                                    return resultList;
                                                }}
                                            </div>
                                        </>
                                    );
                                }

                                return resultList;
                            }}
                        </div>
                    );
                } else if (variableObject.isMenuItemSkill.state) {
                    resultList.push(
                        <div class="skill_wrapper">
                            <div class="button_wrapper">
                                <button
                                    onClick={() => {
                                        methodObject.onClickSkillUpload();
                                    }}
                                    disabled={() => variableObject.isSkillUpload.state}
                                >
                                    {() => {
                                        const resultList: IvirtualNode[] = [];

                                        if (variableObject.isSkillUpload.state) {
                                            resultList.push(<i class="cls_icon">update</i>);
                                        } else {
                                            resultList.push(
                                                <>
                                                    <i class="cls_icon">upload_file</i>
                                                    <p>Upload</p>
                                                </>
                                            );
                                        }

                                        return resultList;
                                    }}
                                </button>
                                {() => {
                                    const result: IvirtualNode[] = [];

                                    if (variableObject.skillSelectList.state.length > 0) {
                                        result.push(
                                            <button
                                                class="delete_selected"
                                                onClick={() => {
                                                    methodObject.onClickSkillDeleteSelected();
                                                }}
                                            >
                                                <i class="cls_icon">delete</i>
                                                <p>Delete selected</p>
                                            </button>
                                        );
                                    }

                                    return result;
                                }}
                            </div>
                            <div class="table_flex">
                                <div class="row header">
                                    <div class="cell select"></div>
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
                                    {() => {
                                        const resultList: IvirtualNode[] = [];

                                        for (const [key, value] of Object.entries(variableObject.skillList.state)) {
                                            resultList.push(
                                                <div key={key} class="row">
                                                    <div class="cell select">
                                                        <input
                                                            type="checkbox"
                                                            checked={() => variableObject.skillSelectList.state.includes(value.fileName)}
                                                            onChange={() => {
                                                                methodObject.onClickSkillCheckbox(value.fileName);
                                                            }}
                                                        />
                                                    </div>
                                                    <div class="cell delete">
                                                        <i
                                                            class="cls_icon"
                                                            onClick={() => {
                                                                methodObject.onClickSkillDelete(value.fileName);
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

                                        return resultList;
                                    }}
                                </div>
                            </div>
                            <aside jsmvcfw-controllerName="Pagination" jsmvcfw-parentView="right" />
                        </div>
                    );
                } else if (variableObject.isMenuItemTool.state) {
                    resultList.push(
                        <div class="tool_wrapper">
                            <ul>
                                {() => {
                                    const resultList: IvirtualNode[] = [];

                                    for (const [key, value] of Object.entries(variableObject.toolList.state)) {
                                        resultList.push(
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

                                    return resultList;
                                }}
                            </ul>
                        </div>
                    );
                } else if (variableObject.isMenuItemTask.state) {
                    resultList.push(
                        <div class="task_wrapper">
                            <ul>
                                {() => {
                                    const resultList: IvirtualNode[] = [];

                                    for (const [key, value] of Object.entries(variableObject.taskList.state)) {
                                        resultList.push(
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

                                    return resultList;
                                }}
                            </ul>
                        </div>
                    );
                } else if (variableObject.isMenuItemAgent.state) {
                    resultList.push(
                        <div class="agent_wrapper">
                            {() => {
                                const resultList: IvirtualNode[] = [];

                                if (variableObject.isAgentSkillSelect.state) {
                                    resultList.push(
                                        <>
                                            <div class="button_wrapper">
                                                <button
                                                    onClick={() => {
                                                        methodObject.onClickSelectSkillBack();
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
                                                    {() => {
                                                        const resultList: IvirtualNode[] = [];

                                                        for (const [key, value] of Object.entries(variableObject.skillList.state)) {
                                                            resultList.push(
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
                                                                            onClick={() => {
                                                                                methodObject.onClickSkillSelect(value.fileName);
                                                                            }}
                                                                        >
                                                                            <p>Pick</p>
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }

                                                        return resultList;
                                                    }}
                                                </div>
                                            </div>
                                            <aside jsmvcfw-controllerName="Pagination" jsmvcfw-parentView="right" />
                                        </>
                                    );
                                } else if (Object.keys(variableObject.agentForm.state).length > 0) {
                                    resultList.push(
                                        <div class="form_wrapper">
                                            <div class="field">
                                                <p class="label">Name:</p>
                                                <textarea jsmvcfw-elementHookName="elementInputAgentName" rows="1">
                                                    {variableObject.agentForm.state.name}
                                                </textarea>
                                            </div>
                                            <div class="field">
                                                <p class="label">Description:</p>
                                                <textarea jsmvcfw-elementHookName="elementInputAgentDescription" rows="4">
                                                    {variableObject.agentForm.state.description}
                                                </textarea>
                                            </div>
                                            <div class="field">
                                                <p class="label">Skill:</p>
                                                <div class="select_wrapper">
                                                    <button
                                                        onClick={() => {
                                                            methodObject.onClickSelectSkill();
                                                        }}
                                                    >
                                                        <p>Select</p>
                                                    </button>
                                                    {() => {
                                                        const resultList: IvirtualNode[] = [];

                                                        if (variableObject.agentForm.state.skillName !== "") {
                                                            resultList.push(
                                                                <div class="skill">
                                                                    <img src={`/asset/image/icon_ui/lightbulb.svg`} />
                                                                    <p>{variableObject.agentForm.state.skillName}</p>
                                                                </div>
                                                            );
                                                        }

                                                        return resultList;
                                                    }}
                                                </div>
                                            </div>
                                            <div class="button_wrapper">
                                                <button
                                                    onClick={() => {
                                                        methodObject.onClickAgentSave();
                                                    }}
                                                    disabled={() => variableObject.isAgentSave.state}
                                                >
                                                    {() => {
                                                        const resultList: IvirtualNode[] = [];

                                                        if (variableObject.isAgentSave.state) {
                                                            resultList.push(<i class="cls_icon">update</i>);
                                                        } else {
                                                            resultList.push(<p>Save</p>);
                                                        }

                                                        return resultList;
                                                    }}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        methodObject.onClickAgentCancel();
                                                    }}
                                                >
                                                    <p>Cancel</p>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                } else {
                                    resultList.push(
                                        <>
                                            <div class="button_wrapper">
                                                <button
                                                    onClick={() => {
                                                        methodObject.onClickAgentCreate();
                                                    }}
                                                >
                                                    <i class="cls_icon">add</i>
                                                    <p>Create</p>
                                                </button>
                                            </div>
                                            <ul>
                                                {() => {
                                                    const resultList: IvirtualNode[] = [];

                                                    const entryList = Object.entries(variableObject.agentList.state);

                                                    for (const [key, value] of entryList) {
                                                        resultList.push(
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
                                                                        onClick={() => {
                                                                            methodObject.onClickAgentEdit(value.id);
                                                                        }}
                                                                    >
                                                                        edit
                                                                    </i>
                                                                    <i
                                                                        class="cls_icon"
                                                                        onClick={() => {
                                                                            methodObject.onClickAgentDelete(Number(key), value.id, value.name);
                                                                        }}
                                                                    >
                                                                        delete
                                                                    </i>
                                                                </div>
                                                                <p class="bottom">{value.description}</p>
                                                                {() => {
                                                                    const resultList: IvirtualNode[] = [];

                                                                    if (value.skillName !== "") {
                                                                        resultList.push(
                                                                            <div class="skill">
                                                                                <img src={`/asset/image/icon_ui/lightbulb.svg`} />
                                                                                <p>{value.skillName}</p>
                                                                            </div>
                                                                        );
                                                                    }

                                                                    return resultList;
                                                                }}
                                                            </li>
                                                        );
                                                    }

                                                    return resultList;
                                                }}
                                            </ul>
                                        </>
                                    );
                                }

                                return resultList;
                            }}
                        </div>
                    );
                } else if (variableObject.isMenuItemUser.state) {
                    resultList.push(
                        <div class="user_wrapper">
                            <div class="form_wrapper">
                                <div class="field">
                                    <p class="label">Email:</p>
                                    <input
                                        value={() => variableObject.userInfo.state.email}
                                        jsmvcfw-elementHookName="elementInputUserEmail"
                                        placeholder="Email"
                                    ></input>
                                </div>
                                <div class="field">
                                    <p class="label">Password:</p>
                                    <input
                                        value={() => variableObject.userInfo.state.password}
                                        jsmvcfw-elementHookName="elementInputUserPassword"
                                        placeholder="Password"
                                        type="password"
                                    ></input>
                                </div>
                                <div class="button_wrapper">
                                    <button
                                        onClick={() => {
                                            methodObject.onClickUserUpdate();
                                        }}
                                        disabled={() => variableObject.isUserUpdate.state}
                                    >
                                        {() => {
                                            const resultList: IvirtualNode[] = [];

                                            if (variableObject.isUserUpdate.state) {
                                                resultList.push(<i class="cls_icon">update</i>);
                                            } else {
                                                resultList.push(<p>Update</p>);
                                            }

                                            return resultList;
                                        }}
                                    </button>
                                    <button
                                        onClick={() => {
                                            methodObject.onClickUserCancel();
                                        }}
                                    >
                                        <p>Cancel</p>
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                } else if (variableObject.isMenuItemSetting.state) {
                    resultList.push(
                        <div class="setting_wrapper">
                            <div class="form_wrapper">
                                <div class="field">
                                    <p class="label">API:</p>
                                    <select value={() => variableObject.settingInfo.state.apiId} jsmvcfw-elementHookName="elementSelectSettingApiId">
                                        <option value="1" selected={() => variableObject.settingInfo.state.apiId === 1}>
                                            Local
                                        </option>
                                        <option value="2" selected={() => variableObject.settingInfo.state.apiId === 2}>
                                            Anthropic
                                        </option>
                                        <option value="3" selected={() => variableObject.settingInfo.state.apiId === 3}>
                                            OpenAI
                                        </option>
                                    </select>
                                </div>
                                <div class="button_wrapper">
                                    <button
                                        onClick={() => {
                                            methodObject.onClickSettingSave();
                                        }}
                                        disabled={() => variableObject.isSettingSave.state}
                                    >
                                        {() => {
                                            const resultList: IvirtualNode[] = [];

                                            if (variableObject.isSettingSave.state) {
                                                resultList.push(<i class="cls_icon">update</i>);
                                            } else {
                                                resultList.push(<p>Save</p>);
                                            }

                                            return resultList;
                                        }}
                                    </button>
                                    <button
                                        onClick={() => {
                                            methodObject.onClickSettingCancel();
                                        }}
                                    >
                                        <p>Cancel</p>
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                }

                return resultList;
            }}
        </div>
    );
};
