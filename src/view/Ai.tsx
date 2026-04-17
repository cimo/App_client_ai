import { jsxFactory, IvirtualNode } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelAi from "../model/Ai";

const viewAi = (variableObject: modelAi.Ivariable, methodObject: modelAi.Imethod): IvirtualNode => {
    return (
        <div class="view_ai">
            <div class="container_header">
                <p>Model selected: {variableObject.modelSelected.state}</p>
                <div class="dropdown">
                    <i
                        class="cls_icon"
                        onClick={() => {
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
            <aside jsmvcfw-controllerName="Chat" view="message" />
            <aside jsmvcfw-controllerName="Mcp" view="tool" />
            <aside jsmvcfw-controllerName="Chat" view="input" />
        </div>
    );
};

export default viewAi;
