import { Icontroller, IvariableEffect, IvirtualNode, variableBind, variableLink } from "@cimo/jsmvcfw/dist/src/Main.js";
import { getCurrentWindow, type Window, getAllWindows } from "@tauri-apps/api/window";
//import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";

// Source
import * as session from "../Session";
import * as modelIndex from "../model/Index";
import * as modelMcp from "../model/Mcp";
import * as modelChat from "../model/Chat.js";
import viewIndex from "../view/Index";
import ControllerAi from "./Ai";
import ControllerMcp from "./Mcp";
import ControllerChat from "./Chat";
import ControllerMenuItem from "./MenuItem";
import ControllerToast from "./Toast";

export default class Index implements Icontroller {
    // Variable
    private variableObject: modelIndex.Ivariable;
    private methodObject: modelIndex.Imethod;

    private controllerAi: ControllerAi;
    private controllerMcp: ControllerMcp;
    private controllerChat: ControllerChat;
    private controllerMenuItem: ControllerMenuItem;
    private controllerToast: ControllerToast;

    private windowApp: Window;

    private isClosing: boolean;
    private intervalAd: ReturnType<typeof setInterval> | undefined;

    // Method
    private mcpApi = async (): Promise<void> => {
        await this.controllerMcp.apiUserQuery();
        await this.controllerMcp.apiSettingQuery();

        await this.controllerMcp.apiTool();
        await this.controllerMcp.apiTask();
    };

    private aiApi = async (): Promise<void> => {
        if (this.variableObject.llmInstance.state) {
            if (!session.data.aiCookie) {
                await this.controllerAi.apiLogin();
            } else {
                if (!this.variableObject.setting.state.llmList[0].selected) {
                    await this.controllerAi.apiLogout();
                }
            }

            await this.variableObject.llmInstance.state.apiModel(false);
        }
    };

    private onClickLoginBasic = async (): Promise<void> => {
        const isLogin = await this.controllerMcp.apiLogin(
            "basic",
            this.hookObject.elementInputUsername.value,
            this.hookObject.elementInputPassword.value
        );

        if (isLogin) {
            await this.mcpApi();
        }
    };

    private onClickLoginAd = async (): Promise<void> => {
        if (!this.intervalAd) {
            const isLogin = await this.controllerMcp.apiLogin("ad");

            if (isLogin) {
                let isIntervalRunning = false;
                let intervalCount = 0;

                this.intervalAd = setInterval(async () => {
                    if (isIntervalRunning) {
                        return;
                    }

                    intervalCount++;

                    isIntervalRunning = true;

                    const state = await this.controllerMcp.apiAdVerify();

                    if (state !== "ongoing" || intervalCount >= 30) {
                        clearInterval(this.intervalAd);
                        this.intervalAd = undefined;

                        this.variableObject.adUrl.state = "";

                        if (state === "ok") {
                            await this.mcpApi();
                        }
                    }

                    isIntervalRunning = false;
                }, 1000);
            }
        }
    };

    private onClickRefreshPage = (): void => {
        window.location.reload();
    };

    private onClickAdCopyUrl = (): void => {
        navigator.clipboard.writeText(this.variableObject.adUrl.state);
    };

    private onClickAdOpenUrl = (): void => {
        openUrl(this.variableObject.adUrl.state);
    };

    constructor() {
        this.variableObject = {} as modelIndex.Ivariable;
        this.methodObject = {} as modelIndex.Imethod;

        this.controllerAi = new ControllerAi();
        this.controllerMcp = new ControllerMcp();
        this.controllerChat = new ControllerChat();
        this.controllerMenuItem = new ControllerMenuItem();
        this.controllerToast = new ControllerToast();

        this.controllerAi.setControllerChat(this.controllerChat);
        this.controllerAi.setControllerMcp(this.controllerMcp);
        this.controllerAi.setControllerToast(this.controllerToast);
        this.controllerMcp.setControllerToast(this.controllerToast);
        this.controllerChat.setControllerMcp(this.controllerMcp);
        this.controllerChat.setControllerToast(this.controllerToast);
        this.controllerMenuItem.setControllerMcp(this.controllerMcp);

        this.windowApp = getCurrentWindow();

        this.isClosing = false;
        this.intervalAd = undefined;
    }

    hookObject = {} as modelIndex.IelementHook;

    variable(): void {
        this.variableObject = variableBind(
            {
                isViewHidden: true,
                isOfflineAi: variableLink<boolean>("Ai"),
                adUrl: variableLink<string>("Mcp"),
                isOfflineMcp: variableLink<boolean>("Mcp"),
                isLogin: variableLink<boolean>("Mcp"),
                setting: variableLink<modelMcp.Isetting>("Mcp"),
                llmInstance: variableLink<modelChat.TllmInstance | null>("Chat")
            },
            this.constructor.name
        );

        this.methodObject = {
            onClickLoginBasic: this.onClickLoginBasic,
            onClickLoginAd: this.onClickLoginAd,
            onClickRefreshPage: this.onClickRefreshPage,
            onClickAdCopyUrl: this.onClickAdCopyUrl,
            onClickAdOpenUrl: this.onClickAdOpenUrl
        };
    }

    variableEffect(watch: IvariableEffect): void {
        watch([
            {
                variableList: ["llmInstance"],
                action: async () => {
                    await this.aiApi();
                }
            }
        ]);
    }

    view(): IvirtualNode {
        return viewIndex(this.variableObject, this.methodObject);
    }

    event(): void {
        this.windowApp.onCloseRequested(async () => {
            if (this.isClosing) {
                return;
            }

            this.isClosing = true;

            if (this.windowApp.label === "main") {
                const windowList = await getAllWindows();

                for (let a = 0; a < windowList.length; a++) {
                    const window = windowList[a];

                    if (window.label !== "main") {
                        await window.close();
                    }
                }

                await this.controllerAi.apiLogout();
                await this.controllerMcp.apiLogout();
            }

            await this.windowApp.close();
        });
    }

    subControllerList(): Icontroller[] {
        const resultList: Icontroller[] = [];

        resultList.push(this.controllerAi);
        resultList.push(this.controllerMenuItem);

        return resultList;
    }

    rendered(): void {
        (async () => {
            if (session.data.mcpCookie && session.data.mcpSessionId) {
                this.variableObject.isLogin.state = true;

                await this.mcpApi();
            }

            if (this.windowApp.label === "main") {
                this.variableObject.isViewHidden.state = false;
            }
        })();
    }

    destroy(): void {}
}
