import { Icontroller, IvariableEffect, IvirtualNode, variableBind, variableLink } from "@cimo/jsmvcfw/dist/src/Main.js";
import { getCurrentWindow, CloseRequestedEvent, type Window, getAllWindows } from "@tauri-apps/api/window";
//import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";

// Source
import * as session from "../Session";
import * as helperSrc from "../HelperSrc";
import * as modelIndex from "../model/Index";
import viewIndex from "../view/Index";
import ControllerChat from "./Chat";
import ControllerAi from "./Ai";
import ControllerMcp from "./Mcp";
import ControllerMenuItem from "./MenuItem";
import ControllerToast from "./Toast";

export default class Index implements Icontroller {
    // Variable
    private variableObject: modelIndex.Ivariable;
    private methodObject: modelIndex.Imethod;

    private controllerChat: ControllerChat;
    private controllerAi: ControllerAi;
    private controllerMcp: ControllerMcp;
    private controllerMenuItem: ControllerMenuItem;
    private controllerToast: ControllerToast;

    private windowApp: Window;

    private isClosing: boolean;

    // Method
    private onClickAd = (event: Event): void => {
        event.preventDefault();

        if (helperSrc.IS_DEBUG) {
            this.variableObject.adUrl.state = "";
        } else {
            openUrl(this.variableObject.adUrl.state);
        }
    };

    private onClickRefreshPage = (): void => {
        window.location.reload();
    };

    constructor() {
        this.variableObject = {} as modelIndex.Ivariable;
        this.methodObject = {} as modelIndex.Imethod;

        this.controllerChat = new ControllerChat();
        this.controllerAi = new ControllerAi();
        this.controllerMcp = new ControllerMcp();
        this.controllerMenuItem = new ControllerMenuItem();
        this.controllerToast = new ControllerToast();

        this.controllerChat.setControllerMcp(this.controllerMcp);
        this.controllerChat.setControllerToast(this.controllerToast);
        this.controllerAi.setControllerChat(this.controllerChat);
        this.controllerAi.setControllerMcp(this.controllerMcp);
        this.controllerAi.setControllerToast(this.controllerToast);
        this.controllerMcp.setControllerToast(this.controllerToast);
        this.controllerMenuItem.setControllerMcp(this.controllerMcp);
        this.controllerMenuItem.setControllerToast(this.controllerToast);

        this.windowApp = getCurrentWindow();

        this.isClosing = false;
    }

    hookObject = {} as modelIndex.IelementHook;

    variable(): void {
        this.variableObject = variableBind(
            {
                adUrl: "",
                isOfflineAi: variableLink<boolean>("Ai"),
                isOfflineMcp: variableLink<boolean>("Mcp")
            },
            this.constructor.name
        );

        this.methodObject = {
            onClickAd: this.onClickAd,
            onClickRefreshPage: this.onClickRefreshPage
        };
    }

    variableEffect(watch: IvariableEffect): void {
        watch([]);
    }

    view(): IvirtualNode {
        return viewIndex(this.variableObject, this.methodObject);
    }

    event(): void {
        this.windowApp.onCloseRequested(async (event: CloseRequestedEvent) => {
            if (this.isClosing) {
                return;
            }

            event.preventDefault();

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
            if (!session.data.aiCookie) {
                await this.controllerAi.apiLogin();
            }

            await this.controllerAi.apiUserInfo();
            await this.controllerAi.apiModel(false);

            if (!session.data.mcpCookie) {
                await this.controllerMcp.apiLogin();
            }

            await this.controllerMcp.apiTool();
            await this.controllerMcp.apiTask();
        })();
    }

    destroy(): void {}
}
