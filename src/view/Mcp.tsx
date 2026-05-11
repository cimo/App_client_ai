import { jsxFactory, jsxFragment, IvirtualNode } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelMcp from "../model/Mcp";

export const tool = (variableObject: modelMcp.Ivariable, methodObject: modelMcp.Imethod): IvirtualNode => {
    return (
        <div class="view_mcp_tool">
            <div class="container_chip">
                <div
                    class={`chip ${variableObject.toolSelected.state.name || variableObject.taskSelected.state.name || variableObject.agentSelected.state.name ? "" : "none"}`}
                >
                    {(() => {
                        const result: IvirtualNode[] = [];

                        let nameSelected = "";

                        if (variableObject.toolSelected.state.name) {
                            nameSelected = variableObject.toolSelected.state.name;
                        } else if (variableObject.taskSelected.state.name) {
                            nameSelected = variableObject.taskSelected.state.name;
                        } else if (variableObject.agentSelected.state.name) {
                            nameSelected = variableObject.agentSelected.state.name;
                        }

                        result.push(
                            <>
                                <i
                                    class="cls_icon close"
                                    onClick={() => {
                                        methodObject.onClickChipClose();
                                    }}
                                >
                                    cancel
                                </i>
                                <p>{nameSelected}</p>
                            </>
                        );

                        return result;
                    })()}
                </div>
            </div>
        </div>
    );
};

export const upload = (variableObject: modelMcp.Ivariable, methodObject: modelMcp.Imethod): IvirtualNode => {
    return (
        <div class="view_mcp_upload">
            <div
                class="chip"
                onClick={() => {
                    methodObject.onClickChipDocumentUpload();
                }}
            >
                <i class="cls_icon">upload_file</i>
                <p>Document</p>
            </div>

            <div
                class="chip"
                onClick={() => {
                    methodObject.onClickChipSkillUpload();
                }}
            >
                <i class="cls_icon">upload_file</i>
                <p>Skill</p>
            </div>
        </div>
    );
};
