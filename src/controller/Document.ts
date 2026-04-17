import { Icontroller, IvariableEffect, IvirtualNode, variableBind } from "@cimo/jsmvcfw/dist/src/Main.js";
import { getCurrentWindow, type Window } from "@tauri-apps/api/window";
import { listen, emitTo } from "@tauri-apps/api/event";

// Source
import * as helperSrc from "../HelperSrc";
import * as modelDocument from "../model/Document";
import viewDocument from "../view/Document";
import ControllerMcp from "./Mcp";

export default class Document implements Icontroller {
    // Variable
    private variableObject: modelDocument.Ivariable;
    private methodObject: modelDocument.Imethod;
    private controllerMcp: ControllerMcp;

    private appWindow: Window;

    // Method
    private onInputChangePage = (event: Event): void => {
        const inputValue = parseInt((event.target as HTMLInputElement).value.replace(/\D+/g, ""));

        this.readHtmlContent(inputValue);
    };

    private readHtmlContent = async (pageNumber: number): Promise<void> => {
        const appWindowTitle = await this.appWindow.title();
        const baseFileName = helperSrc.baseFileName(appWindowTitle);

        const fileName = `${baseFileName}_${pageNumber}.html`;

        const result = await this.controllerMcp.apiFileRead(fileName, baseFileName);

        if (result) {
            this.variableObject.fileContent.state = window.atob(result.fileContent);
            this.variableObject.pageTotal.state = result.pageTotal;
        }
    };

    constructor() {
        this.variableObject = {} as modelDocument.Ivariable;
        this.methodObject = {} as modelDocument.Imethod;

        this.controllerMcp = new ControllerMcp();

        this.appWindow = getCurrentWindow();

        this.appWindow.title().then(async (appWindowTitle) => {
            await this.readHtmlContent(1);

            await emitTo("main", "document-init", { fileName: appWindowTitle });
        });
    }

    hookObject = {} as modelDocument.IelementHook;

    variable(): void {
        this.variableObject = variableBind(
            {
                isMessageSent: false,
                chatMessageList: [],
                fileContent: "",
                pageNumber: 1,
                pageTotal: 1
            },
            this.constructor.name
        );

        this.methodObject = {
            onInputChangePage: this.onInputChangePage
        };
    }

    variableEffect(watch: IvariableEffect): void {
        watch([]);
    }

    view(): IvirtualNode {
        return viewDocument(this.variableObject, this.methodObject);
    }

    event(): void {
        (async () => {
            await listen<string[]>("document-content-update", async (event) => {
                this.appWindow.title().then(async (appWindowTitle) => {
                    const fileName = event.payload[0];
                    const pageNumber = parseInt(event.payload[1]);

                    if (fileName === appWindowTitle) {
                        await this.readHtmlContent(pageNumber);

                        this.variableObject.pageNumber.state = pageNumber;
                    }
                });
            });
        })();
    }

    subControllerList(): Icontroller[] {
        const resultList: Icontroller[] = [];

        return resultList;
    }

    rendered(): void {}

    destroy(): void {}
}
