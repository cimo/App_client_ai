import { jsxFactory, jsxFragment, IvirtualNode } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelMcp from "../model/Mcp";

export const tool = (variableObject: modelMcp.Ivariable, methodObject: modelMcp.Imethod): IvirtualNode => {
    return (
        <div class="view_tool">
            <div class="container_chip">
                <div class={`chip ${variableObject.toolSelected.state.name || variableObject.taskSelected.state.name ? "" : "none"}`}>
                    {(() => {
                        const result: IvirtualNode[] = [];

                        let mode = "";

                        if (variableObject.toolSelected.state.name) {
                            mode = "tool";
                        } else if (variableObject.taskSelected.state.name) {
                            mode = "task";
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
                                <p>{mode === "tool" ? variableObject.toolSelected.state.name : variableObject.taskSelected.state.name}</p>
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
        <div
            class="chip"
            onClick={() => {
                methodObject.onClickChipUpload();
            }}
        >
            <i class="cls_icon">upload_file</i>
            <p>Upload</p>
        </div>
    );
};
