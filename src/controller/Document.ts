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
    private onClickChangePage = (event: Event, difference: number): void => {
        event.stopPropagation();

        const elementInputValue = this.hookObject.elementInputPageNumber.value;
        const pageNumber = !isNaN(parseInt(elementInputValue)) ? parseInt(elementInputValue) : 1;

        let pageNumberNew = pageNumber + difference;

        if (pageNumberNew < 1) {
            pageNumberNew = 1;
        } else if (pageNumberNew > this.variableObject.pageTotal.state) {
            pageNumberNew = this.variableObject.pageTotal.state;
        }

        this.variableObject.pageNumber.state = pageNumberNew;

        if (pageNumberNew !== pageNumber) {
            this.readContentData(pageNumberNew);
        }
    };

    private onInputChangePage = (event: KeyboardEvent): void => {
        event.stopPropagation();

        const elementInputValue = this.hookObject.elementInputPageNumber.value.replace(/\D+/g, "");
        const pageNumber = !isNaN(parseInt(elementInputValue)) ? parseInt(elementInputValue) : 1;
        this.variableObject.pageNumber.state = pageNumber;

        if (event.key === "Enter") {
            this.readContentData(pageNumber);
        }
    };

    private readContentData = async (pageNumber: number): Promise<void> => {
        this.variableObject.isLoadingPage.state = true;

        const appWindowTitle = await this.appWindow.title();
        const fileDetail = helperSrc.fileDetail(appWindowTitle);

        if (pageNumber < 1) {
            this.variableObject.isPageExist.state = false;
            this.variableObject.isLoadingPage.state = false;

            return;
        } else if (pageNumber > this.variableObject.pageTotal.state) {
            this.variableObject.isPageExist.state = false;
            this.variableObject.isLoadingPage.state = false;

            return;
        }

        const documentReadObject = await this.controllerMcp.apiDocumentRead(fileDetail.fileName, pageNumber);

        if (documentReadObject) {
            if (fileDetail.category === "image") {
                this.variableObject.imageContent.state = documentReadObject.fileContent;
            } else {
                this.variableObject.htmlContent.state = window.atob(documentReadObject.fileContent);
            }

            this.variableObject.pageTotal.state = documentReadObject.pageTotal;
            this.variableObject.pageNumber.state = pageNumber;
            this.variableObject.isPageExist.state = true;
            this.variableObject.isLoadingPage.state = false;
            this.variableObject.isLoadingWindow.state = false;
        }
    };

    constructor() {
        this.variableObject = {} as modelDocument.Ivariable;
        this.methodObject = {} as modelDocument.Imethod;

        this.controllerMcp = new ControllerMcp();

        this.appWindow = getCurrentWindow();

        this.appWindow.title().then((appWindowTitle) => {
            const interval = setInterval(async () => {
                if (Object.keys(this.controllerMcp.getVariableObject()).length > 0) {
                    await this.readContentData(1);

                    await emitTo("main", "document-data", { fileName: appWindowTitle });

                    clearInterval(interval);
                }
            }, 1000);
        });
    }

    hookObject = {} as modelDocument.IelementHook;

    variable(): void {
        this.variableObject = variableBind(
            {
                isLoadingWindow: true,
                isLoadingPage: true,
                isPageExist: true,
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
        listen<string[]>("document-content-update", (event) => {
            this.appWindow.title().then(async (appWindowTitle) => {
                const fileName = event.payload[0];

                let pageNumber = parseInt(event.payload[1]);
                pageNumber = isNaN(pageNumber) ? 1 : pageNumber;

                if (fileName === appWindowTitle) {
                    await this.readContentData(pageNumber === -1 ? this.variableObject.pageNumber.state : pageNumber);
                }
            });
        });
    }

    subControllerList(): Icontroller[] {
        const resultList: Icontroller[] = [];

        resultList.push(this.controllerMcp);

        return resultList;
    }

    rendered(): void {}

    destroy(): void {}
}
