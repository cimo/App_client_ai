import { Icontroller, IvariableEffect, IvirtualNode, variableBind } from "@cimo/jsmvcfw/dist/src/Main.js";
import { getCurrentWindow, type Window } from "@tauri-apps/api/window";
import { listen, emitTo, UnlistenFn } from "@tauri-apps/api/event";

// Source
import * as helperSrc from "../HelperSrc";
import * as modelDocument from "../model/Document";
import viewDocument from "../view/Document";
import ControllerMcp from "./Mcp";

export default class Document implements Icontroller {
    // Variable
    private variableObject: modelDocument.Ivariable;
    private controllerMcp: ControllerMcp;

    private windowDocument: Window;
    private windowDocumentTitle = "";

    private unlistenWindowContentUpdate: UnlistenFn | undefined = undefined;

    // Method
    private readContentData = async (): Promise<void> => {
        const windowDocumentTitle = await this.windowDocument.title();
        const fileDetail = helperSrc.fileDetail(windowDocumentTitle);

        const fileContent = await this.controllerMcp.apiDocumentRead(fileDetail.fileName);

        if (fileContent) {
            if (fileDetail.category === "image") {
                this.variableObject.imageContent.state = fileContent;
            } else {
                const decodedList = window.atob(fileContent);
                const unicodeList = new Uint8Array(decodedList.length);

                for (let a = 0; a < decodedList.length; a++) {
                    unicodeList[a] = decodedList.charCodeAt(a);
                }

                const blob = new Blob([unicodeList], { type: "application/pdf" });

                const pdfContent = new URL("/asset/library/pdfjs/web/viewer.html", window.location.origin);
                pdfContent.searchParams.set("file", URL.createObjectURL(blob));
                pdfContent.hash = "pagemode=none";

                this.variableObject.pdfContent.state = pdfContent.toString();
            }

            this.variableObject.isLoadingWindow.state = false;
        }
    };

    private injectSearchInput = (text: string): void => {
        if (this.hookObject.elementPdfViewer.contentWindow) {
            const contentWindow = this.hookObject.elementPdfViewer.contentWindow as modelDocument.IpdfViewerWindow;
            const app = contentWindow.PDFViewerApplication as modelDocument.IpdfViewerApplication;

            const isFilter = text !== "" ? true : false;

            if (app) {
                if (app.findBar) {
                    if (isFilter && app.findBar.open) {
                        app.findBar.open();
                    }

                    if (app.findBar.findField) {
                        app.findBar.findField.value = text;
                    }

                    if (app.findBar.entireWord) {
                        app.findBar.entireWord.checked = isFilter;
                    }

                    if (app.findBar.highlightAll) {
                        app.findBar.highlightAll.checked = isFilter;
                    }
                }

                app.eventBus.dispatch("find", {
                    source: window,
                    query: text,
                    entireWord: isFilter,
                    highlightAll: isFilter
                });
            }
        }
    };

    constructor() {
        this.variableObject = {} as modelDocument.Ivariable;

        this.controllerMcp = new ControllerMcp();

        this.windowDocument = getCurrentWindow();

        this.windowDocument.onCloseRequested(() => {
            emitTo("main", "document-close", { fileName: this.windowDocumentTitle });

            this.windowDocument.destroy();
        });
    }

    hookObject = {} as modelDocument.IelementHook;

    variable(): void {
        this.variableObject = variableBind(
            {
                isLoadingWindow: true,
                pdfContent: "",
                imageContent: ""
            },
            this.constructor.name
        );
    }

    variableEffect(watch: IvariableEffect): void {
        watch([]);
    }

    view(): IvirtualNode {
        return viewDocument(this.variableObject);
    }

    event(): void {
        listen<string[]>("document-content-update", (event) => {
            this.windowDocument.title().then((windowDocumentTitle) => {
                const fileName = event.payload[0];
                const searchText = event.payload[1];

                if (windowDocumentTitle === fileName) {
                    this.injectSearchInput(searchText);
                }
            });
        }).then((unlistenFn) => {
            this.unlistenWindowContentUpdate = unlistenFn;
        });
    }

    subControllerList(): Icontroller[] {
        const resultList: Icontroller[] = [];

        resultList.push(this.controllerMcp);

        return resultList;
    }

    rendered(): void {
        this.windowDocument.title().then((windowDocumentTitle) => {
            this.windowDocumentTitle = windowDocumentTitle;

            this.readContentData();

            let isIntervalRunning = false;

            const interval = setInterval(() => {
                if (isIntervalRunning) {
                    return;
                }

                isIntervalRunning = true;

                const contentWindow = this.hookObject.elementPdfViewer.contentWindow as modelDocument.IpdfViewerWindow;

                if (contentWindow && contentWindow.PDFViewerApplication) {
                    emitTo("main", "document-data", { fileName: this.windowDocumentTitle });

                    if (interval) {
                        clearInterval(interval);
                    }
                }

                isIntervalRunning = false;
            }, 1000);
        });
    }

    destroy(): void {
        if (this.unlistenWindowContentUpdate !== undefined) {
            this.unlistenWindowContentUpdate();

            this.unlistenWindowContentUpdate = undefined;
        }
    }
}
