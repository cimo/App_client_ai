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
    private onClickChangePage = (pageDifference: number): void => {
        const currentPage = parseInt(this.hookObject.elementInputPageNumber.value);

        if (!isNaN(currentPage)) {
            let newPage = currentPage + pageDifference;

            if (newPage < 1) {
                newPage = 1;
            } else if (newPage > this.variableObject.pageTotal.state) {
                newPage = this.variableObject.pageTotal.state;
            }

            this.hookObject.elementInputPageNumber.value = newPage.toString();

            if (newPage !== currentPage) {
                this.readHtmlContent(newPage);
            }
        }
    };

    private onInputChangePage = (): void => {
        const inputValue = this.hookObject.elementInputPageNumber.value.replace(/\D+/g, "");
        this.hookObject.elementInputPageNumber.value = inputValue;

        const pageNumber = parseInt(inputValue);

        if (!isNaN(pageNumber)) {
            this.readHtmlContent(pageNumber);
        }
    };

    private readHtmlContent = async (pageNumber: number): Promise<void> => {
        const appWindowTitle = await this.appWindow.title();

        const result = await this.controllerMcp.apiDocumentRead(appWindowTitle, pageNumber);

        if (result) {
            if (helperSrc.filterMimeType(appWindowTitle) === "image") {
                this.variableObject.imageContent.state = result.fileContent;
            } else {
                this.variableObject.htmlContent.state = window.atob(result.fileContent);
            }

            this.variableObject.pageTotal.state = result.pageTotal;
            this.variableObject.pageNumber.state = pageNumber;
        }
    };

    constructor() {
        this.variableObject = {} as modelDocument.Ivariable;
        this.methodObject = {} as modelDocument.Imethod;

        this.controllerMcp = new ControllerMcp();

        this.appWindow = getCurrentWindow();

        this.appWindow.title().then(async (appWindowTitle) => {
            const interval = setInterval(async () => {
                if (Object.keys(this.controllerMcp.getVariableObject()).length > 0) {
                    await this.readHtmlContent(1);

                    await emitTo("main", "document-init", { fileName: appWindowTitle });

                    clearInterval(interval);
                }
            }, 1000);
        });
    }

    hookObject = {} as modelDocument.IelementHook;

    variable(): void {
        this.variableObject = variableBind(
            {
                htmlContent: "",
                imageContent: "",
                pageNumber: 1,
                pageTotal: 1
            },
            this.constructor.name
        );

        this.methodObject = {
            onInputChangePage: this.onInputChangePage,
            onClickChangePage: this.onClickChangePage
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
                        await this.readHtmlContent(pageNumber === -1 ? this.variableObject.pageNumber.state : pageNumber);
                    }
                });
            });
        })();
    }

    subControllerList(): Icontroller[] {
        const resultList: Icontroller[] = [];

        resultList.push(this.controllerMcp);

        return resultList;
    }

    rendered(): void {}

    destroy(): void {}
}
