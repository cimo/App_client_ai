import { Icontroller, IvirtualNode, variableBind, variableLink, IvariableEffect } from "@cimo/jsmvcfw/dist/src/Main.js";
import { fetch } from "@tauri-apps/plugin-http";

// Source
import * as session from "../Session";
import * as helperSrc from "../HelperSrc";
import * as modelHelperSrc from "../model/HelperSrc.js";
import * as modelAi from "../model/Ai";
import * as modelMcp from "../model/Mcp";
import * as modelChat from "../model/Chat.js";
import viewAi from "../view/Ai";
import type Mcp from "./Mcp";
import type Chat from "./Chat";
import type Toast from "./Toast";

export default class Ai implements Icontroller {
    // Variable
    private variableObject: modelAi.Ivariable;
    private methodObject: modelAi.Imethod;
    private controllerMcp: Mcp;
    private controllerChat: Chat;
    private controllerToast: Toast;

    // Method
    private onClickDropdownModel = async (): Promise<void> => {
        if (this.variableObject.llmInstance.state) {
            await this.variableObject.llmInstance.state.apiModel(true);
        }
    };

    private onClickModelName = (name: string): void => {
        this.variableObject.modelSelected.state = name;
    };

    setControllerToast(value: Toast): void {
        this.controllerToast = value;
    }

    setControllerMcp(value: Mcp): void {
        this.controllerMcp = value;
    }

    setControllerChat(value: Chat): void {
        this.controllerChat = value;
    }

    apiLogin = async (): Promise<void> => {
        if (!session.data.aiCookie && this.variableObject.setting.state.llmList[0].selected) {
            const settingLlm = this.variableObject.setting.state.llmList[0];

            let header: HeadersInit | undefined = {};

            if (settingLlm.apiKey) {
                header = {
                    ...header,
                    Authorization: `Bearer ${settingLlm.apiKey}`
                };
            }

            return fetch(`${settingLlm.url}/login`, {
                method: "GET",
                headers: header,
                danger: {
                    acceptInvalidCerts: true,
                    acceptInvalidHostnames: true
                }
            })
                .then(async (resultApi) => {
                    this.variableObject.isOfflineAi.state = false;

                    const cookie = resultApi.headers.get("set-cookie");

                    if (cookie) {
                        const json = (await resultApi.json()) as modelHelperSrc.IapiResponse;

                        if (json.response.state === "ko") {
                            this.controllerMcp.showToastMessage("error", json.response.message);
                        } else {
                            session.writeAiSession(cookie);
                        }
                    }
                })
                .catch((error: Error) => {
                    helperSrc.writeLog("Ai.ts - apiLogin() - fetch() - catch()", error.message);

                    this.variableObject.isOfflineAi.state = true;
                });
        }
    };

    apiLogout = async (): Promise<void | Response> => {
        if (session.data.aiCookie) {
            const settingLlm = this.variableObject.setting.state.llmList[0];

            let header: HeadersInit | undefined = {
                "Content-Type": "application/json",
                "ai-cookie": session.data.aiCookie
            };

            if (settingLlm.apiKey) {
                header = {
                    ...header,
                    Authorization: `Bearer ${settingLlm.apiKey}`
                };
            }

            return fetch(`${settingLlm.url}/logout`, {
                method: "GET",
                headers: header,
                danger: {
                    acceptInvalidCerts: true,
                    acceptInvalidHostnames: true
                }
            })
                .then(async (resultApi) => {
                    this.variableObject.isOfflineAi.state = false;

                    const json = (await resultApi.json()) as modelHelperSrc.IapiResponse;

                    if (json.response.state === "ko") {
                        this.controllerMcp.showToastMessage("error", json.response.message);
                    } else {
                        session.deleteAiSession();
                    }
                })
                .catch((error: Error) => {
                    helperSrc.writeLog("Ai.ts - apiLogout() - fetch() - catch()", error.message);

                    this.variableObject.isOfflineAi.state = true;
                });
        }
    };

    constructor() {
        this.variableObject = {} as modelAi.Ivariable;
        this.methodObject = {} as modelAi.Imethod;
        this.controllerMcp = {} as Mcp;
        this.controllerChat = {} as Chat;
        this.controllerToast = {} as Toast;
    }

    hookObject = {} as modelAi.IelementHook;

    variable(): void {
        this.variableObject = variableBind(
            {
                isOfflineAi: false,
                isOpenDropdownModelList: false,
                modelList: [],
                modelSelected: "",
                setting: variableLink<modelMcp.Isetting>("Mcp"),
                llmInstance: variableLink<modelChat.TllmInstance | null>("Chat")
            },
            this.constructor.name
        );

        this.methodObject = {
            onClickDropdownModel: this.onClickDropdownModel,
            onClickModelName: this.onClickModelName
        };
    }

    variableEffect(watch: IvariableEffect): void {
        watch([]);
    }

    view(): IvirtualNode {
        return viewAi(this.variableObject, this.methodObject);
    }

    event(): void {
        document.addEventListener("click", (event) => {
            const target = event.target as HTMLElement;

            if (!helperSrc.findElementParent(target, "dropdown") || helperSrc.findElementParent(target, "menu")) {
                this.variableObject.isOpenDropdownModelList.state = false;
            }
        });
    }

    subControllerList(): Icontroller[] {
        const resultList: Icontroller[] = [];

        resultList.push(this.controllerToast);
        resultList.push(this.controllerChat);
        resultList.push(this.controllerMcp);

        return resultList;
    }

    rendered(): void {}

    destroy(): void {}
}
