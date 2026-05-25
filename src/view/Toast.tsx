import { jsxFactory, IvirtualNode } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelToast from "../model/Toast";

const viewToast = (variableObject: modelToast.Ivariable): IvirtualNode => {
    return (
        <div class="view_toast">
            <div class={`container_toast ${variableObject.toastType.state} ${variableObject.toastMessage.state ? "" : "none"}`}>
                <i class="cls_icon">info</i>
                <p>{variableObject.toastMessage.state}</p>
            </div>
        </div>
    );
};

export default viewToast;
