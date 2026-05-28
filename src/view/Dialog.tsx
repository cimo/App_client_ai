import { jsxFactory, IvirtualNode } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelDialog from "../model/Dialog";

const viewDialog = (variableObject: modelDialog.Ivariable, methodObject: modelDialog.Imethod): IvirtualNode => {
    return (
        <div class="view_dialog">
            <div class="message_container">
                <i class="cls_icon">{variableObject.mode.state}</i>
                <p>{variableObject.message.state}</p>
            </div>
            <div class="button_container">
                <button
                    onClick={() => {
                        methodObject.onClickOk();
                    }}
                >
                    <p>OK</p>
                </button>
                {(() => {
                    const result: IvirtualNode[] = [];

                    if (!variableObject.isConfirm.state) {
                        result.push(
                            <button
                                onClick={() => {
                                    methodObject.onClickCancel();
                                }}
                            >
                                <p>Cancel</p>
                            </button>
                        );
                    }

                    return result;
                })()}
            </div>
        </div>
    );
};

export default viewDialog;
