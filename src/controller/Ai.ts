import { Icontroller, IvirtualNode, variableBind, variableLink, IvariableEffect } from "@cimo/jsmvcfw/dist/src/Main.js";
import { fetch } from "@tauri-apps/plugin-http";

// Source
import * as session from "../Session";
import * as helperSrc from "../HelperSrc";
import * as controllerLlm from "../controller/Llm";
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
            if (this.variableObject.settingLlmServiceId.state === 1) {
                await this.variableObject.llmInstance.state.apiModel(true);
            } else {
                controllerLlm.updateModel(this.controllerChat, this.variableObject.llmInstance.state.modelAvailableList, true);
            }
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

    apiResponseJson = async (resultApi: Response): Promise<modelHelperSrc.IapiResponse> => {
        return helperSrc.apiResponseJson(resultApi, session.deleteAiSession, "Ai session expired, login again.");
    };

    apiLogin = async (): Promise<void> => {
        if (!session.data.aiCookie && (this.variableObject.settingLlmServiceId.state === 1 || this.variableObject.settingLlmUsageId.state === 2)) {
            return fetch(`${helperSrc.URL_AI}/login`, {
                method: "GET",
                headers: {},
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
            return fetch(`${helperSrc.URL_AI}/logout`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "ai-cookie": session.data.aiCookie,
                    "mcp-session-id": session.data.mcpSessionId
                },
                danger: {
                    acceptInvalidCerts: true,
                    acceptInvalidHostnames: true
                }
            })
                .then(async (resultApi) => {
                    this.variableObject.isOfflineAi.state = false;

                    const json = await this.apiResponseJson(resultApi);

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
                llmInstance: variableLink<modelChat.TllmInstance | null>("Chat"),
                settingLlmServiceId: variableLink<number>("MenuItem"),
                settingLlmUsageId: variableLink<number>("MenuItem")
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
