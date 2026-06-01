import { jsxFactory, IvirtualNode } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelToast from "../model/Toast";

const viewToast = (variableObject: modelToast.Ivariable, methodObject: modelToast.Imethod): IvirtualNode => {
    return (
        <div class="view_toast">
            <div class={`message_container ${variableObject.mode.state} ${variableObject.messageList.state.length > 0 ? "" : "none"}`}>
                <i class="cls_icon">info</i>
                <div class="list_container">
                    {(() => {
                        const result: IvirtualNode[] = [];

                        for (const [key, value] of Object.entries(variableObject.messageList.state)) {
                            result.push(<p key={key}>{value}</p>);
                        }

                        return result;
                    })()}
                </div>
                {(() => {
                    const result: IvirtualNode[] = [];

                    if (variableObject.timeClose.state === 0) {
                        result.push(
                            <i
                                class="cls_icon close"
                                onClick={(event: Event) => {
                                    methodObject.onClickClose(event);
                                }}
                            >
                                close
                            </i>
                        );
                    }

                    return result;
                })()}
            </div>
        </div>
    );
};

export default viewToast;
