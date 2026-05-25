import { jsxFactory, IvirtualNode } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelIndex from "../model/Index";

const viewIndex = (variableObject: modelIndex.Ivariable, methodObject: modelIndex.Imethod): IvirtualNode => {
    return (
        <div class="view_index" jsmvcfw-controllerName="Index">
            <div
                class={`over_container ${variableObject.isOfflineMcp.state || variableObject.isOfflineAi.state || variableObject.adUrl.state !== "" ? "" : "none"}`}
            >
                <div
                    class={variableObject.isOfflineMcp.state || variableObject.isOfflineAi.state ? "" : "none"}
                    onClick={() => {
                        methodObject.onClickRefreshPage();
                    }}
                >
                    <i class="cls_icon">report_off</i>
                    <p>Click here for re-connect.</p>
                </div>
                <div
                    class={!variableObject.isOfflineMcp.state && !variableObject.isOfflineAi.state && variableObject.adUrl.state !== "" ? "" : "none"}
                    onClick={(event: Event) => {
                        methodObject.onClickAd(event);
                    }}
                >
                    <i class="cls_icon">login</i>
                    <p>Click here for connect to AD.</p>
                </div>
            </div>
            <div class="center_container">
                <div class="left_container">
                    <aside jsmvcfw-controllerName="MenuItem" view="left" />
                </div>
                <div class="right_container">
                    <aside jsmvcfw-controllerName="Ai" />
                    <aside jsmvcfw-controllerName="MenuItem" view="right" />
                </div>
            </div>
        </div>
    );
};

export default viewIndex;
