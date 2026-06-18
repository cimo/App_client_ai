import { jsxFactory, IvirtualNode } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as helperSrc from "../HelperSrc";
import * as modelIndex from "../model/Index";

const viewIndex = (variableObject: modelIndex.Ivariable, methodObject: modelIndex.Imethod): IvirtualNode => {
    return (
        <div class={`view_index ${variableObject.isViewHidden.state ? "none" : ""}`} jsmvcfw-controllerName="Index">
            <div
                class={`over_wrapper ${!variableObject.isLogin.state || variableObject.isOfflineMcp.state || variableObject.isOfflineAi.state ? "" : "none"}`}
            >
                <div
                    class={`reconnect_wrapper ${variableObject.isOfflineMcp.state || variableObject.isOfflineAi.state ? "" : "none"}`}
                    onClick={() => {
                        methodObject.onClickRefreshPage();
                    }}
                >
                    <i class="cls_icon">report_off</i>
                    <p>Click here for re-connect.</p>
                </div>
                <div class={`login_wrapper ${!variableObject.isLogin.state ? "" : "none"}`}>
                    <div class={`login_form_wrapper ${helperSrc.IS_DEBUG ? "" : "none"}`}>
                        <input jsmvcfw-elementHookName="elementInputUsername" placeholder="Username"></input>
                        <input jsmvcfw-elementHookName="elementInputPassword" placeholder="Password" type="password"></input>
                    </div>
                    <div class="form_button_wrapper">
                        <button
                            class={helperSrc.IS_DEBUG ? "" : "none"}
                            onClick={(event: Event) => {
                                methodObject.onClickLoginBasic(event);
                            }}
                        >
                            <p>Basic Login</p>
                        </button>
                        <button
                            onClick={(event: Event) => {
                                methodObject.onClickLoginAd(event);
                            }}
                        >
                            <p>AD Login</p>
                        </button>
                    </div>
                </div>
            </div>
            <div class="main_wrapper">
                <div class="left_wrapper">
                    <aside jsmvcfw-controllerName="MenuItem" view="left" />
                </div>
                <div class="right_wrapper">
                    <aside jsmvcfw-controllerName="Ai" />
                    <aside jsmvcfw-controllerName="MenuItem" view="right" />
                </div>
            </div>
        </div>
    );
};

export default viewIndex;
