import { jsxFactory, IvirtualNode } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelDialog from "../model/Dialog";

const viewDialog = (variableObject: modelDialog.Ivariable, methodObject: modelDialog.Imethod): IvirtualNode => {
    return (
        <div class="view_dialog">
            <div class="message_wrapper">
                <i class="cls_icon">{variableObject.mode.state}</i>
                <p>{variableObject.message.state}</p>
            </div>
            <div class="button_wrapper">
                <button
                    onClick={() => {
                        methodObject.onClickOk();
                    }}
                >
                    <p>OK</p>
                </button>
                {(() => {
                    const resultList: IvirtualNode[] = [];

                    if (!variableObject.isConfirm.state) {
                        resultList.push(
                            <button
                                onClick={() => {
                                    methodObject.onClickCancel();
                                }}
                            >
                                <p>Cancel</p>
                            </button>
                        );
                    }

                    return resultList;
                })()}
            </div>
        </div>
    );
};

export default viewDialog;
