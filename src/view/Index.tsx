import { jsxFactory, IvirtualNode } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelIndex from "../model/Index";

const viewIndex = (variableObject: modelIndex.Ivariable, methodObject: modelIndex.Imethod): IvirtualNode => {
    return (
        <div class="page_container view_index" jsmvcfw-controllerName="Index">
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
            <div class="container_messageReceive row">
                {(() => {
                    const result: IvirtualNode[] = [];

                    if (variableObject.messageSendCopy.state) {
                        result.push(
                            <div class="container_messageSend_copy">
                                <p>{variableObject.messageSendCopyTime.state}</p>
                                <pre>{variableObject.messageSendCopy.state}</pre>
                            </div>
                        );
                    }

                    if (variableObject.modelResponseThink.state) {
                        result.push(
                            <details>
                                <summary>Show reasoning</summary>
                                <pre>{variableObject.modelResponseThink.state}</pre>
                            </details>
                        );
                    }

                    return result;
                })()}
                <pre>{variableObject.modelResponseNoThink.state}</pre>
            </div>
            <div class="container_messageSend row">
                <label for="messageSend"></label>
                <textarea jsmvcfw-elementHookName="elementInputMessageSend" id="messageSend" name="messageSend" rows="4"></textarea>
                <button
                    onclick={() => {
                        methodObject.onClickButtonMessageSend();
                    }}
                >
                    Send
                </button>
            </div>
        </div>
    );
};

export default viewIndex;
