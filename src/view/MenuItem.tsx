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
                                                <div class="left_button_wrapper">
                                                    <button
                                                        onClick={() => {
                                                            methodObject.onClickDocumentUpload();
                                                        }}
                                                        disabled={() => methodObject.checkProcessOngoing("document")}
                                                    >
                                                        {() => {
                                                            const resultList: IvirtualNode[] = [];

                                                            if (!variableObject.isUploadRunning.state) {
                                                                resultList.push(
                                                                    <>
                                                                        <i class="cls_icon">upload_file</i>
                                                                        <p>Upload</p>
                                                                    </>
                                                                );
                                                            } else {
                                                                resultList.push(<i class="cls_icon">update</i>);
                                                            }

                                                            return resultList;
                                                        }}
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            methodObject.onClickRagStart();
                                                        }}
                                                        disabled={() => methodObject.checkProcessOngoing("document")}
                                                    >
                                                        {() => {
                                                            const resultList: IvirtualNode[] = [];

                                                            if (!variableObject.isRagRunning.state) {
                                                                resultList.push(
                                                                    <>
                                                                        <i class="cls_icon">storage</i>
                                                                        <p>RAG - Start</p>
                                                                    </>
                                                                );
                                                            } else {
                                                                resultList.push(<i class="cls_icon">update</i>);
                                                            }

                                                            return resultList;
                                                        }}
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            methodObject.onClickRagGraph();
                                                        }}
                                                        disabled={() => methodObject.checkProcessOngoing("document")}
                                                    >
                                                        {() => {
                                                            const resultList: IvirtualNode[] = [];

                                                            if (!variableObject.isRagRunning.state) {
                                                                resultList.push(
                                                                    <>
                                                                        <i class="cls_icon">analytics</i>
                                                                        <p>RAG - Graph</p>
                                                                    </>
                                                                );
                                                            } else {
                                                                resultList.push(<i class="cls_icon">update</i>);
                                                            }

                                                            return resultList;
                                                        }}
                                                    </button>
                                                </div>
                                                <div class="right_button_wrapper">
                                                    {() => {
                                                        const result: IvirtualNode[] = [];

                                                        if (variableObject.documentSelectList.state.length > 0) {
                                                            result.push(
                                                                <>
                                                                    <button
                                                                        onClick={() => {
                                                                            methodObject.onClickDocumentDeleteSelected();
                                                                        }}
                                                                        disabled={() => methodObject.checkProcessOngoing("document")}
                                                                    >
                                                                        {() => {
                                                                            const resultList: IvirtualNode[] = [];

                                                                            if (!variableObject.isDeleteRunning.state) {
                                                                                resultList.push(
                                                                                    <>
                                                                                        <i class="cls_icon">delete</i>
                                                                                        <p>Delete selected</p>
                                                                                    </>
                                                                                );
                                                                            } else {
                                                                                resultList.push(<i class="cls_icon">update</i>);
                                                                            }

                                                                            return resultList;
                                                                        }}
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            methodObject.onClickDocumentFolderMoveTo();
                                                                        }}
                                                                        disabled={() => methodObject.checkProcessOngoing("document")}
                                                                    >
                                                                        {() => {
                                                                            const resultList: IvirtualNode[] = [];

                                                                            if (!variableObject.isDocumentFolderMoveRunning.state) {
                                                                                resultList.push(
                                                                                    <>
                                                                                        <i class="cls_icon">drive_file_move</i>
                                                                                        <p>
                                                                                            {variableObject.isDocumentFolderMoveSelecting.state
                                                                                                ? "Cancel"
                                                                                                : "Move to"}
                                                                                        </p>
                                                                                    </>
                                                                                );
                                                                            } else {
                                                                                resultList.push(<i class="cls_icon">update</i>);
                                                                            }

                                                                            return resultList;
                                                                        }}
                                                                    </button>
                                                                </>
                                                            );
                                                        }

                                                        if (variableObject.documentCurrentFolderList.state.length > 0) {
                                                            result.push(
                                                                <button
                                                                    onClick={() => {
                                                                        methodObject.onClickDocumentFolderBack();
                                                                    }}
                                                                    disabled={() => methodObject.checkProcessOngoing("document")}
                                                                >
                                                                    <i class="cls_icon">drive_file_move_rtl</i>
                                                                    <p>Back</p>
                                                                </button>
                                                            );
                                                        }

                                                        result.push(
                                                            <button
                                                                class="button_create_folder"
                                                                onClick={() => {
                                                                    methodObject.onClickDocumentFolderCreate();
                                                                }}
                                                                disabled={() =>
                                                                    variableObject.isDocumentFolderStillCreate.state ||
                                                                    methodObject.checkProcessOngoing("document")
                                                                }
                                                            >
                                                                <i class="cls_icon">create_new_folder</i>
                                                                <p>Create folder</p>
                                                            </button>
                                                        );

                                                        return result;
                                                    }}
                                                </div>
                                            </div>
                                            <div class="breadcrumb_wrapper">
                                                {() => {
                                                    const resultList: IvirtualNode[] = [];

                                                    if (variableObject.isDocumentFolderMoveSelecting.state) {
                                                        resultList.push(
                                                            <button
                                                                onClick={() => {
                                                                    methodObject.onClickDocumentFolderHere();
                                                                }}
                                                                disabled={() => methodObject.checkProcessOngoing("document")}
                                                            >
                                                                <p>Here</p>
                                                            </button>
                                                        );
                                                    }

                                                    return resultList;
                                                }}
                                                <p>
                                                    Current path: ./{variableObject.documentCurrentFolderList.state.join("/")}
                                                    {variableObject.documentCurrentFolderList.state.length > 0 ? "/" : ""}
                                                </p>
                                            </div>
                                            <div class="table_flex">
                                                <div class="row header">
                                                    <div class="cell id">
                                                        <p>ID</p>
                                                    </div>
                                                    <div class="cell select">
                                                        {() => {
                                                            const resultList: IvirtualNode[] = [];

                                                            if (variableObject.documentList.state.length > 0) {
                                                                resultList.push(
                                                                    <button
                                                                        onClick={() => {
                                                                            methodObject.onClickToggleSelectAll("document");
                                                                        }}
                                                                        disabled={() => methodObject.checkProcessOngoing("document")}
                                                                    >
                                                                        <i class="cls_icon">
                                                                            {() =>
                                                                                methodObject.selectAllCheck("document")
                                                                                    ? "check_box_outline_blank"
                                                                                    : "check_box"
                                                                            }
                                                                        </i>
                                                                    </button>
                                                                );
                                                            }

                                                            return resultList;
                                                        }}
                                                    </div>
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
                                                {() => {
                                                    const resultList: IvirtualNode[] = [];

                                                    if (!methodObject.checkProcessOngoing("document")) {
                                                        resultList.push(
                                                            <div class="body">
                                                                {() => {
                                                                    const resultList: IvirtualNode[] = [];

                                                                    for (const [key, value] of Object.entries(variableObject.documentList.state)) {
                                                                        resultList.push(
                                                                            <div key={key} class="row">
                                                                                <div class="cell id">
                                                                                    <p>{methodObject.itemId(key)}</p>
                                                                                </div>
                                                                                <div class="cell select">
                                                                                    {() => {
                                                                                        const resultList: IvirtualNode[] = [];

                                                                                        if (value.fileName) {
                                                                                            resultList.push(
                                                                                                <input
                                                                                                    type="checkbox"
                                                                                                    checked={() =>
                                                                                                        variableObject.documentSelectList.state.includes(
                                                                                                            methodObject.itemPathCurrent(
                                                                                                                "document",
                                                                                                                value.fileName
                                                                                                            )
                                                                                                        )
                                                                                                    }
                                                                                                    onChange={() => {
                                                                                                        methodObject.onClickCheckbox(
                                                                                                            "document",
                                                                                                            value.fileName
                                                                                                        );
                                                                                                    }}
                                                                                                />
                                                                                            );
                                                                                        }

                                                                                        return resultList;
                                                                                    }}
                                                                                </div>
                                                                                <div class="cell delete">
                                                                                    {() => {
                                                                                        const resultList: IvirtualNode[] = [];

                                                                                        if (value.fileName) {
                                                                                            resultList.push(
                                                                                                <i
                                                                                                    class="cls_icon"
                                                                                                    onClick={() => {
                                                                                                        methodObject.onClickDocumentDelete(
                                                                                                            value.fileName
                                                                                                        );
                                                                                                    }}
                                                                                                >
                                                                                                    delete
                                                                                                </i>
                                                                                            );
                                                                                        }

                                                                                        return resultList;
                                                                                    }}
                                                                                </div>
                                                                                <div class="cell name">
                                                                                    <img
                                                                                        class="icon"
                                                                                        src={`/asset/image/icon_file/${value.extension ? value.extension : value.category}.svg`}
                                                                                    />
                                                                                    {() => {
                                                                                        const resultList: IvirtualNode[] = [];

                                                                                        if (!value.fileName) {
                                                                                            resultList.push(
                                                                                                <input
                                                                                                    class="input_folder_name"
                                                                                                    type="text"
                                                                                                    jsmvcfw-elementHookName="elementInputDocumentFolderName"
                                                                                                    onKeyUp={(event: KeyboardEvent) => {
                                                                                                        methodObject.onInputDocumentFolderName(event);
                                                                                                    }}
                                                                                                    autofocus
                                                                                                ></input>
                                                                                            );
                                                                                        } else {
                                                                                            resultList.push(<p>{value.fileName}</p>);
                                                                                        }

                                                                                        return resultList;
                                                                                    }}
                                                                                </div>
                                                                                <div class="cell date">
                                                                                    <p>{helperSrc.localeFormat(new Date(value.dateModified))}</p>
                                                                                </div>
                                                                                <div class="cell size">
                                                                                    <p>{value.size}</p>
                                                                                </div>
                                                                                <div class="cell button">
                                                                                    {() => {
                                                                                        const resultList: IvirtualNode[] = [];

                                                                                        if (value.fileName) {
                                                                                            resultList.push(
                                                                                                <button
                                                                                                    onClick={() =>
                                                                                                        methodObject.onClickDocumentOpen(
                                                                                                            value.fileName,
                                                                                                            value.category
                                                                                                        )
                                                                                                    }
                                                                                                    disabled={() =>
                                                                                                        variableObject.documentOpenList.state.includes(
                                                                                                            value.fileName
                                                                                                        )
                                                                                                    }
                                                                                                >
                                                                                                    <p>Open</p>
                                                                                                </button>
                                                                                            );
                                                                                        }

                                                                                        return resultList;
                                                                                    }}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    }

                                                                    return resultList;
                                                                }}
                                                            </div>
                                                        );
                                                    } else {
                                                        resultList.push(
                                                            <div class="body_loading">
                                                                <i class="cls_icon">update</i>
                                                                <p>Loading...</p>
                                                            </div>
                                                        );
                                                    }

                                                    return resultList;
                                                }}
                                            </div>
                                            {() => {
                                                const resultList: IvirtualNode[] = [];

                                                if (!methodObject.checkProcessOngoing("document")) {
                                                    resultList.push(<aside jsmvcfw-controllerName="Pagination" jsmvcfw-parentView="right" />);
                                                }

                                                return resultList;
                                            }}
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
                                                        if (!variableObject.isRagGraphHtmlLoading.state) {
                                                            resultList.push(
                                                                <iframe
                                                                    srcdoc={() => variableObject.ragGraphHtml.state}
                                                                    sandbox="allow-scripts"
                                                                ></iframe>
                                                            );
                                                        } else {
                                                            resultList.push(
                                                                <div class="loading_wrapper">
                                                                    <i class="cls_icon">update</i>
                                                                </div>
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
                                <div class="left_button_wrapper">
                                    <button
                                        onClick={() => {
                                            methodObject.onClickSkillUpload();
                                        }}
                                        disabled={() => methodObject.checkProcessOngoing("skill")}
                                    >
                                        {() => {
                                            const resultList: IvirtualNode[] = [];

                                            if (!variableObject.isUploadRunning.state) {
                                                resultList.push(
                                                    <>
                                                        <i class="cls_icon">upload_file</i>
                                                        <p>Upload</p>
                                                    </>
                                                );
                                            } else {
                                                resultList.push(<i class="cls_icon">update</i>);
                                            }

                                            return resultList;
                                        }}
                                    </button>
                                </div>
                                <div class="right_button_wrapper">
                                    {() => {
                                        const result: IvirtualNode[] = [];

                                        if (variableObject.skillSelectList.state.length > 0) {
                                            result.push(
                                                <button
                                                    onClick={() => {
                                                        methodObject.onClickSkillDeleteSelected();
                                                    }}
                                                    disabled={() => methodObject.checkProcessOngoing("skill")}
                                                >
                                                    {() => {
                                                        const resultList: IvirtualNode[] = [];

                                                        if (!variableObject.isDeleteRunning.state) {
                                                            resultList.push(
                                                                <>
                                                                    <i class="cls_icon">delete</i>
                                                                    <p>Delete selected</p>
                                                                </>
                                                            );
                                                        } else {
                                                            resultList.push(<i class="cls_icon">update</i>);
                                                        }

                                                        return resultList;
                                                    }}
                                                </button>
                                            );
                                        }

                                        return result;
                                    }}
                                </div>
                            </div>
                            <div class="table_flex">
                                <div class="row header">
                                    <div class="cell id">
                                        <p>ID</p>
                                    </div>
                                    <div class="cell select">
                                        {() => {
                                            const resultList: IvirtualNode[] = [];

                                            if (variableObject.skillList.state.length > 0) {
                                                resultList.push(
                                                    <button
                                                        onClick={() => {
                                                            methodObject.onClickToggleSelectAll("skill");
                                                        }}
                                                        disabled={() => methodObject.checkProcessOngoing("skill")}
                                                    >
                                                        <i class="cls_icon">
                                                            {() => (methodObject.selectAllCheck("skill") ? "check_box_outline_blank" : "check_box")}
                                                        </i>
                                                    </button>
                                                );
                                            }

                                            return resultList;
                                        }}
                                    </div>
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
                                {() => {
                                    const resultList: IvirtualNode[] = [];

                                    if (!methodObject.checkProcessOngoing("skill")) {
                                        resultList.push(
                                            <div class="body">
                                                {() => {
                                                    const resultList: IvirtualNode[] = [];

                                                    for (const [key, value] of Object.entries(variableObject.skillList.state)) {
                                                        resultList.push(
                                                            <div key={key} class="row">
                                                                <div class="cell id">
                                                                    <p>{methodObject.itemId(key)}</p>
                                                                </div>
                                                                <div class="cell select">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={() => variableObject.skillSelectList.state.includes(value.fileName)}
                                                                        onChange={() => {
                                                                            methodObject.onClickCheckbox("skill", value.fileName);
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
                                        );
                                    } else {
                                        resultList.push(
                                            <div class="body_loading">
                                                <i class="cls_icon">update</i>
                                                <p>Loading...</p>
                                            </div>
                                        );
                                    }

                                    return resultList;
                                }}
                            </div>
                            {() => {
                                const resultList: IvirtualNode[] = [];

                                if (!methodObject.checkProcessOngoing("skill")) {
                                    resultList.push(<aside jsmvcfw-controllerName="Pagination" jsmvcfw-parentView="right" />);
                                }

                                return resultList;
                            }}
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
                                                    <div class="cell id">
                                                        <p>ID</p>
                                                    </div>
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
                                                                    <div class="cell id">
                                                                        <p>{methodObject.itemId(key)}</p>
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
                                } else if (Object.keys(variableObject.agentData.state).length > 0) {
                                    resultList.push(
                                        <div class="form_wrapper">
                                            <div class="field">
                                                <p class="label">Name:</p>
                                                <input
                                                    value={() => variableObject.agentData.state.name}
                                                    jsmvcfw-elementHookName="elementInputAgentName"
                                                ></input>
                                            </div>
                                            <div class="field">
                                                <p class="label">Description:</p>
                                                <textarea jsmvcfw-elementHookName="elementInputAgentDescription" rows="4">
                                                    {variableObject.agentData.state.description}
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

                                                        if (variableObject.agentData.state.skillName !== "") {
                                                            resultList.push(
                                                                <div class="skill">
                                                                    <img src={`/asset/image/icon_ui/lightbulb.svg`} />
                                                                    <p>{variableObject.agentData.state.skillName}</p>
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

                                                        if (!variableObject.isAgentSave.state) {
                                                            resultList.push(<p>Save</p>);
                                                        } else {
                                                            resultList.push(<i class="cls_icon">update</i>);
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
                                    <input value={() => variableObject.user.state.email} type="text" readonly></input>
                                </div>
                                <div class="field">
                                    <p class="label">Name:</p>
                                    <input
                                        value={() => variableObject.user.state.name}
                                        jsmvcfw-elementHookName="elementInputUserName"
                                        type="text"
                                    ></input>
                                </div>
                                <div class="field">
                                    <p class="label">Surname:</p>
                                    <input
                                        value={() => variableObject.user.state.surname}
                                        jsmvcfw-elementHookName="elementInputUserSurname"
                                        type="text"
                                    ></input>
                                </div>
                                <div class="field">
                                    <p class="label">Password:</p>
                                    <input
                                        value={() => variableObject.user.state.password}
                                        jsmvcfw-elementHookName="elementInputUserPassword"
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

                                            if (!variableObject.isUserUpdate.state) {
                                                resultList.push(<p>Update</p>);
                                            } else {
                                                resultList.push(<i class="cls_icon">update</i>);
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
                                <div class="category">
                                    <p class="label">Llm:</p>
                                    <div class="field">
                                        <p class="label">Service:</p>
                                        <select
                                            value={() => variableObject.settingLlmServiceId.state}
                                            jsmvcfw-elementHookName="elementSelectSettingLlmServiceId"
                                            onChange={() => methodObject.onChangeSettingLlmServiceId()}
                                        >
                                            {() => {
                                                const resultList: IvirtualNode[] = [];

                                                for (const [key, value] of Object.entries(variableObject.setting.state.llm)) {
                                                    resultList.push(
                                                        <option key={key} value={value.id} selected={() => value.selected}>
                                                            {value.name}
                                                        </option>
                                                    );
                                                }

                                                return resultList;
                                            }}
                                        </select>
                                    </div>
                                    <div class="field">
                                        <p class="label">Url:</p>
                                        <input
                                            value={() => variableObject.setting.state.llm[variableObject.settingLlmServiceId.state - 1].url}
                                            jsmvcfw-elementHookName="elementInputSettingLlmUrl"
                                            type="text"
                                        ></input>
                                    </div>
                                    <div class="field">
                                        <p class="label">Api key:</p>
                                        <input
                                            value={() => variableObject.setting.state.llm[variableObject.settingLlmServiceId.state - 1].apiKey}
                                            jsmvcfw-elementHookName="elementInputSettingLlmApiKey"
                                            type="password"
                                        ></input>
                                    </div>
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

                                            if (!variableObject.isSettingSave.state) {
                                                resultList.push(<p>Save</p>);
                                            } else {
                                                resultList.push(<i class="cls_icon">update</i>);
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
