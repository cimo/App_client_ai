import { jsxFactory, IvirtualNode } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelToast from "../model/Toast";

const viewToast = (variableObject: modelToast.Ivariable, methodObject: modelToast.Imethod): IvirtualNode => {
    return (
        <div class="view_toast">
            <div class={`message_wrapper ${variableObject.mode.state} ${variableObject.messageList.state.length > 0 ? "" : "none"}`}>
                <i class="cls_icon">info</i>
                <div class="text">
                    {(() => {
                        const resultList: IvirtualNode[] = [];

                        for (const [key, value] of Object.entries(variableObject.messageList.state)) {
                            resultList.push(<p key={key}>{value}</p>);
                        }

                        return resultList;
                    })()}
                </div>
                {(() => {
                    const resultList: IvirtualNode[] = [];

                    if (variableObject.timeClose.state === 0) {
                        resultList.push(
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

                    return resultList;
                })()}
            </div>
        </div>
    );
};

export default viewToast;
