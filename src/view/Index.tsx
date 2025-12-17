import { jsxFactory, IvirtualNode } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelIndex from "../model/Index";

const viewIndex = (variableObject: modelIndex.Ivariable, methodObject: modelIndex.Imethod): IvirtualNode => {
    return (
        <div class="page_container view_index" jsmvcfw-controllerName="Index">
            <div class="row">
                <label for="messageSend">Message to send</label>
                <textarea
                    jsmvcfw-elementHookName="elementInputMessage"
                    id="messageSend"
                    name="messageSend"
                    class="cls_textarea field_value"
                    rows="4"
                ></textarea>
                <button
                    onclick={() => {
                        methodObject.onClickButton();
                    }}
                >
                    Send
                </button>
            </div>
            <div class="row">
                <ul>
                    {(() => {
                        const result: IvirtualNode[] = [];

                        for (const [key, value] of Object.entries(variableObject.modelList.state)) {
                            result.push(<li key={key}>{value.id}</li>);
                        }

                        return result;
                    })()}
                </ul>
            </div>
        </div>
    );
};

export default viewIndex;
