import { Icontroller, IvariableEffect, IvirtualNode, variableBind, variableLink } from "@cimo/jsmvcfw/dist/src/Main.js";
import { getCurrentWindow, CloseRequestedEvent, type Window } from "@tauri-apps/api/window";
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

export default class Index implements Icontroller {
    // Variable
    private variableObject: modelIndex.Ivariable;
    private methodObject: modelIndex.Imethod;

    private controllerChat: ControllerChat;
    private controllerAi: ControllerAi;
    private controllerMcp: ControllerMcp;
    private controllerMenuItem: ControllerMenuItem;

    private appWindow: Window;
    private appIsClosing: boolean;

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

        this.controllerAi.setControllerChat(this.controllerChat);
        this.controllerAi.setControllerMcp(this.controllerMcp);
        this.controllerMcp.setControllerChat(this.controllerChat);
        this.controllerMenuItem.setControllerMcp(this.controllerMcp);

        this.appWindow = getCurrentWindow();
        this.appIsClosing = false;
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
        this.appWindow.onCloseRequested(async (event: CloseRequestedEvent) => {
            if (this.appIsClosing) {
                return;
            }

            event.preventDefault();

            this.appIsClosing = true;

            if (this.appWindow.label === "main") {
                await this.controllerAi.apiLogout();
                await this.controllerMcp.apiLogout();
            }

            await this.appWindow.close();
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
