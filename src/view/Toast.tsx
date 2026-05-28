import { jsxFactory, IvirtualNode } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelToast from "../model/Toast";

const viewToast = (variableObject: modelToast.Ivariable): IvirtualNode => {
    return (
        <div class="view_toast">
            <div class={`message_container ${variableObject.mode.state} ${variableObject.message.state ? "" : "none"}`}>
                <i class="cls_icon">info</i>
                <p>{variableObject.message.state}</p>
            </div>
        </div>
    );
};

export default viewToast;
