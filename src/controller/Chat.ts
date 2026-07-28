import { Icontroller, IvirtualNode, variableBind, variableLink, IvariableEffect } from "@cimo/jsmvcfw/dist/src/Main.js";
import { listen, emitTo, UnlistenFn } from "@tauri-apps/api/event";
import { getAllWindows } from "@tauri-apps/api/window";

// Source
import * as helperSrc from "../HelperSrc";
import * as modelChat from "../model/Chat";
import * as modelMcp from "../model/Mcp";
import * as modelDocument from "../model/Document";
import * as viewChat from "../view/Chat";
import type Mcp from "./Mcp";
import type Toast from "./Toast";

export default class Chat implements Icontroller {
    // Variable
    private methodObject: modelChat.Imethod;

    private unlistenWindowDocumentData: UnlistenFn | undefined = undefined;

    variableObject: modelChat.Ivariable;

    controllerMcp: Mcp;
    controllerToast: Toast;

    responseReason: string;
    responseNoReason: string;
    responseMcpTool: modelMcp.ItoolBody;

    abortControllerLlmResponse: AbortController | undefined;
    fileObject: modelChat.Ifile;
    messageSentCount: number;
    isAutoScrollEnabled: boolean;

    // Method
    private importController = (module: string): Promise<modelChat.TllmInstance | null> => {
        return import(`${module}`)
            .then((resultImport) => {
                const { default: Controller } = resultImport as { default: modelChat.TllmConstructor };

                return new Controller(this);
            })
            .catch((error: Error) => {
                helperSrc.writeLog("Chat.ts - importController() - import() - catch()", error.message);

                return null;
            });
    };

    private currentLlmInstance = async (): Promise<void> => {
        if (Object.keys(this.variableObject.setting.state).length > 0) {
            for (let a = 0; a < this.variableObject.setting.state.llm.length; a++) {
                if (this.variableObject.setting.state.llm[a].selected) {
                    this.variableObject.llmInstance.state = await this.importController(this.variableObject.setting.state.llm[a].module);

                    break;
                }
            }
        }
    };

    private onClickButtonMessageSend = (): void => {
        if (this.abortControllerLlmResponse && !this.variableObject.isMessageSendAvailable.state) {
            this.abortControllerLlmResponse.abort();
            this.abortControllerLlmResponse = undefined;
        } else if (this.variableObject.llmInstance.state) {
            this.variableObject.llmInstance.state.apiResponse();
        }
    };

    private onClickCitationLink = (event: Event, fileName: string, chunk: string): void => {
        event.preventDefault();

        this.fileObject[fileName] = {
            searchInput: chunk
        };

        this.windowOpenDocument(fileName);
    };

    private onClickCitationTab = (messageIndex: number, tabIndex: number): void => {
        const messageListState = this.variableObject.messageList.state.slice();

        messageListState[messageIndex] = {
            ...messageListState[messageIndex],
            ragCitationTabIndex: tabIndex
        };

        this.variableObject.messageList.state = messageListState;
    };

    setControllerMcp(value: Mcp): void {
        this.controllerMcp = value;
    }

    setControllerToast(value: Toast): void {
        this.controllerToast = value;
    }

    responseReset = (mode?: string): void => {
        this.responseReason = "";
        this.responseNoReason = "";
        this.responseMcpTool = {} as modelMcp.ItoolBody;

        if (mode === "finish") {
            this.messageSentCount = Math.max(0, this.messageSentCount - 1);

            if (this.messageSentCount === 0) {
                this.variableObject.isMessageSendAvailable.state = true;
            }
        }
    };

    messageStreamReset = (): void => {
        this.hookObject.elementMessageStreamReasonWrapper.classList.add("none");
        this.hookObject.elementMessageStreamReason.textContent = "";

        this.hookObject.elementMessageStreamNoReason.classList.add("none");
        this.hookObject.elementMessageStreamNoReason.textContent = "";
    };

    messageLoadingHide = (messageIndex: number): void => {
        const message = this.variableObject.messageList.state[messageIndex];

        if (message && message.isLoading) {
            const messageListState = this.variableObject.messageList.state.slice();

            messageListState[messageIndex] = {
                ...messageListState[messageIndex],
                isLoading: false
            };

            this.variableObject.messageList.state = messageListState;
        }
    };

    autoscroll = (): void => {
        requestAnimationFrame(() => {
            if (this.isAutoScrollEnabled) {
                this.hookObject.elementBottomLimit.scrollIntoView({ block: "end", inline: "nearest" });
            }
        });
    };

    windowOpenDocument = async (fileName: string): Promise<void> => {
        const windowLabel = helperSrc.windowLabelUnique("document", fileName);
        const windowList = await getAllWindows();

        const route = "#/document";

        await helperSrc.windowOpen("document", fileName, route, {
            title: fileName,
            url: route,
            decorations: true,
            resizable: true,
            width: 750,
            height: 1000,
            minWidth: 750,
            minHeight: 1050,
            center: true,
            focus: true
        });

        for (let a = 0; a < windowList.length; a++) {
            const window = windowList[a];

            if (window.label === windowLabel && fileName in this.fileObject) {
                emitTo(windowLabel, "document-content-update", [fileName, this.fileObject[fileName].searchInput]);

                delete this.fileObject[fileName];

                break;
            }
        }
    };

    selectedLlm = (): modelMcp.IsettingLlm | null => {
        let llm = null;

        for (let a = 0; a < this.variableObject.setting.state.llm.length; a++) {
            if (this.variableObject.setting.state.llm[a].selected) {
                llm = this.variableObject.setting.state.llm[a];

                break;
            }
        }

        return llm;
    };

    constructor() {
        this.variableObject = {} as modelChat.Ivariable;
        this.methodObject = {} as modelChat.Imethod;
        this.controllerMcp = {} as Mcp;
        this.controllerToast = {} as Toast;

        this.responseReason = "";
        this.responseNoReason = "";
        this.responseMcpTool = {} as modelMcp.ItoolBody;

        this.abortControllerLlmResponse = undefined;

        this.fileObject = {} as modelChat.Ifile;

        this.messageSentCount = 0;

        this.isAutoScrollEnabled = true;
    }

    hookObject = {} as modelChat.IelementHook;

    variable(): void {
        this.variableObject = variableBind(
            {
                isMessageSendAvailable: true,
                messageList: [],
                systemMode: "chat",
                llmInstance: null,
                isOpenDropdownModelList: variableLink<boolean>("Ai"),
                modelList: variableLink<string[]>("Ai"),
                modelSelected: variableLink<string>("Ai"),
                toolSelected: variableLink<modelMcp.Itool>("Mcp"),
                toolList: variableLink<modelMcp.Itool[]>("Mcp"),
                taskSelected: variableLink<modelMcp.Itask>("Mcp"),
                agentSelected: variableLink<modelMcp.Iagent>("Mcp"),
                playwrightVideoSrc: variableLink<string>("Mcp"),
                playwrightVideoName: variableLink<string>("Mcp"),
                setting: variableLink<modelMcp.Isetting>("Mcp")
            },
            this.constructor.name
        );

        this.methodObject = {
            onClickButtonMessageSend: this.onClickButtonMessageSend,
            onClickCitationLink: this.onClickCitationLink,
            onClickCitationTab: this.onClickCitationTab,
            onClickPlaywrightVideoShow: this.controllerMcp.playwrightVideoShow,
            onErrorPlaywrightVideoFail: this.controllerMcp.playwrightVideoFail
        };
    }

    variableEffect(watch: IvariableEffect): void {
        watch([
            {
                variableList: ["setting"],
                action: () => {
                    this.currentLlmInstance();
                }
            }
        ]);
    }

    view(name?: string): IvirtualNode {
        if (name === "message") {
            return viewChat.message(this.variableObject, this.methodObject);
        } else if (name === "input") {
            return viewChat.input(this.variableObject, this.methodObject);
        }

        throw new Error(`Unsupported view: ${String(name)}`);
    }

    event(): void {
        this.hookObject.elementContainerMessageReceive.addEventListener("wheel", (event: WheelEvent) => {
            if (event.deltaY < 0) {
                this.isAutoScrollEnabled = false;
            }
        });

        this.hookObject.elementContainerMessageReceive.addEventListener("scroll", () => {
            const difference =
                this.hookObject.elementContainerMessageReceive.scrollHeight -
                (this.hookObject.elementContainerMessageReceive.scrollTop + this.hookObject.elementContainerMessageReceive.clientHeight);

            this.isAutoScrollEnabled = difference <= 10;
        });

        listen<modelDocument.Idata>("document-data", (event) => {
            const fileName = event.payload.fileName;

            if (fileName && fileName in this.fileObject) {
                const windowLabel = helperSrc.windowLabelUnique("document", fileName);

                emitTo(windowLabel, "document-content-update", [fileName, this.fileObject[fileName].searchInput]);

                delete this.fileObject[fileName];
            }
        }).then((unlistenFn) => {
            this.unlistenWindowDocumentData = unlistenFn;
        });
    }

    subControllerList(): Icontroller[] {
        const resultList: Icontroller[] = [];

        return resultList;
    }

    rendered(): void {}

    destroy(): void {
        if (this.unlistenWindowDocumentData !== undefined) {
            this.unlistenWindowDocumentData();

            this.unlistenWindowDocumentData = undefined;
        }
    }
}
