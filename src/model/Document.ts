import { IvariableBind } from "@cimo/jsmvcfw/dist/src/Main.js";

interface IpdfViewerApplicationEventBus {
    dispatch: (name: string, data: Record<string, unknown>) => void;
}

interface IpdfViewerApplicationFindBar {
    open?: () => void;
    findField?: { value: string };
    entireWord?: { checked: boolean };
    highlightAll?: { checked: boolean };
}

export interface Idata {
    fileName?: string;
    pageNumber: number;
}

export interface IdataRead {
    fileContent: string;
    pageTotal: number;
}

export interface IpdfViewerApplication {
    eventBus: IpdfViewerApplicationEventBus;
    findBar?: IpdfViewerApplicationFindBar;
}

export interface IpdfViewerWindow extends Window {
    PDFViewerApplication?: IpdfViewerApplication;
}

export interface Ivariable {
    isLoadingWindow: IvariableBind<boolean>;
    pdfContent: IvariableBind<string>;
    imageContent: IvariableBind<string>;
}

export interface Imethod {}

export interface IelementHook extends Record<string, Element | Element[]> {
    elementPdfViewer: HTMLIFrameElement;
}
