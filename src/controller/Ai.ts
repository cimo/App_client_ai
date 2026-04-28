import { Icontroller, IvirtualNode, variableBind, variableLink, IvariableEffect } from "@cimo/jsmvcfw/dist/src/Main.js";
import { fetch } from "@tauri-apps/plugin-http";

// Source
import * as session from "../Session";
import * as helperSrc from "../HelperSrc";
import * as modelAi from "../model/Ai";
import * as modelIndex from "../model/Index";
import viewAi from "../view/Ai";
import type Mcp from "./Mcp";
import type Chat from "./Chat";

export default class Ai implements Icontroller {
    // Variable
    private variableObject: modelAi.Ivariable;
    private methodObject: modelAi.Imethod;
    private controllerMcp: Mcp;
    private controllerChat: Chat;

    // Method
    private generateUniqueId = (): string => {
        const timestamp = Date.now().toString(36);
        const randomPart = crypto.getRandomValues(new Uint32Array(1))[0].toString(36);

        const uniqueId = `${timestamp}-${randomPart}`;

        return uniqueId;
    };

    private apiModel = (): void => {
        fetch(`${helperSrc.URL_AI}/api/model`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${session.data.aiBearerToken}`,
                Cookie: session.data.aiCookie
            },
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        })
            .then(async (result) => {
                this.variableObject.isOfflineAi.state = false;

                const resultJson = (await result.json()) as modelIndex.IresponseBody;
                const jsonParse = JSON.parse(resultJson.response.stdout) as modelAi.IapiModelResponse;
                const resultCleaned = [];

                for (const value of jsonParse.data) {
                    if (value.id.toLowerCase().includes("embedding")) {
                        continue;
                    }

                    resultCleaned.push(value);
                }

                this.variableObject.modelList.state = [...resultCleaned].sort((a, b) => a.id.localeCompare(b.id));

                this.variableObject.isOpenDropdownModelList.state = true;
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Index.ts - apiModel() - fetch() - catch()", error.message);

                this.variableObject.isOfflineAi.state = true;
            });
    };

    private onClickDropdownModel = (): void => {
        this.apiModel();
    };

    private onClickModelName = (name: string): void => {
        this.variableObject.modelSelected.state = name;

        this.controllerChat.setModelSelected(this.variableObject.modelSelected.state);
    };

    setControllerMcp(controller: Mcp): void {
        this.controllerMcp = controller;
    }

    setControllerChat(controller: Chat): void {
        this.controllerChat = controller;

        this.controllerChat.setModelSelected(helperSrc.MODEL_DEFAULT);
    }

    apiLogin = async (): Promise<void | Response> => {
        return fetch(`${helperSrc.URL_AI}/login`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${session.data.aiBearerToken}`
            },
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        })
            .then(async (result) => {
                this.variableObject.isOfflineAi.state = false;

                const cookie = result.headers.get("set-cookie") || "";

                session.writeAiSession(session.data.aiBearerToken, cookie);

                const resultJson = (await result.json()) as modelIndex.IresponseBody;

                this.variableObject.adUrl.state = resultJson.response.stdout;
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Index.ts - apiLogin() - fetch() - catch()", error.message);

                this.variableObject.isOfflineAi.state = true;
            });
    };

    apiUserInfo = async (): Promise<void | Response> => {
        return fetch(`${helperSrc.URL_AI}/user-info`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${session.data.aiBearerToken}`,
                Cookie: session.data.aiCookie
            },
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        })
            .then(async (result) => {
                this.variableObject.isOfflineAi.state = false;

                const resultJson = (await result.json()) as modelIndex.IresponseBody;

                // eslint-disable-next-line no-console
                console.log("cimo - apiUserInfo()", resultJson);
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Index.ts - apiUserInfo() - fetch() - catch()", error.message);

                this.variableObject.isOfflineAi.state = true;
            });
    };

    apiLogout = async (): Promise<void | Response> => {
        return fetch(`${helperSrc.URL_AI}/logout`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${session.data.aiBearerToken}`,
                Cookie: session.data.aiCookie
            },
            danger: {
                acceptInvalidCerts: true,
                acceptInvalidHostnames: true
            }
        })
            .then(() => {
                this.variableObject.isOfflineAi.state = false;

                session.deleteAiSession();
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Index.ts - apiLogout() - fetch() - catch()", error.message);

                this.variableObject.isOfflineAi.state = true;
            });
    };

    constructor() {
        this.variableObject = {} as modelAi.Ivariable;
        this.methodObject = {} as modelAi.Imethod;
        this.controllerMcp = {} as Mcp;
        this.controllerChat = {} as Chat;

        if (!session.data.aiBearerToken) {
            session.data.aiBearerToken = this.generateUniqueId();
        }
    }

    hookObject = {} as modelAi.IelementHook;

    variable(): void {
        this.variableObject = variableBind(
            {
                isOfflineAi: false,
                isOpenDropdownModelList: false,
                modelList: [],
                modelSelected: helperSrc.MODEL_DEFAULT,
                adUrl: variableLink<string>("Index")
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

        resultList.push(this.controllerChat);
        resultList.push(this.controllerMcp);

        return resultList;
    }

    rendered(): void {}

    destroy(): void {}
}
