import { jsxFactory, IvirtualNode } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelIndex from "../model/Index";

const viewIndex = (variableObject: modelIndex.Ivariable, methodObject: modelIndex.Imethod): IvirtualNode => {
    return (
        <div class="page_container view_index" jsmvcfw-controllerName="Index">
            <div class="container_actionBar">
                <div class="selector_model">
                    <div
                        onclick={() => {
                            methodObject.onClickButtonModelList();
                        }}
                    >
                        ...
                    </div>
                    <pre class={`dialog ${!variableObject.isOpenDialogModelList.state ? "none" : ""}`}>
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
                    </pre>
                </div>
            </div>
            <div jsmvcfw-elementHookName="elementContainerMessageReceive" class="container_message_receive">
                {(() => {
                    const result: IvirtualNode[] = [];

                    for (const [key, value] of Object.entries(variableObject.chatMessage.state)) {
                        result.push(
                            <div key={key}>
                                <div class="container_chat">
                                    <p>{value.time}</p>
                                    <pre>{value.user}</pre>
                                </div>
                                <details>
                                    <summary>Show reasoning</summary>
                                    <pre>{value.assistantThink}</pre>
                                </details>
                                <pre>{value.assistantNoThink}</pre>
                            </div>
                        );
                    }

                    return result;
                })()}
                <div jsmvcfw-elementHookName="elementBottomLimit" class="bottom_limit"></div>
            </div>
            <div class="container_message_send">
                <textarea jsmvcfw-elementHookName="elementInputMessageSend" name="messageSend" rows="4"></textarea>
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
