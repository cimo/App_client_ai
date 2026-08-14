import { jsxFactory, IvirtualNode } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelDocument from "../model/Document";

const viewDocument = (variableObject: modelDocument.Ivariable): IvirtualNode => {
    return (
        <div class="view_document" jsmvcfw-controllerName="Document">
            <aside jsmvcfw-controllerName="Mcp" />
            <div class="main_wrapper">
                {() => {
                    const resultList: IvirtualNode[] = [];

                    if (!variableObject.isLoadingWindow.state) {
                        resultList.push(
                            <div class="data_wrapper">
                                {() => {
                                    const resultList: IvirtualNode[] = [];

                                    if (variableObject.pdfContent.state !== "") {
                                        resultList.push(
                                            <iframe jsmvcfw-elementHookName="elementPdfViewer" src={() => variableObject.pdfContent.state} />
                                        );
                                    } else if (variableObject.imageContent.state !== "") {
                                        resultList.push(<img src={() => `data:image/png;base64,${variableObject.imageContent.state}`} />);
                                    }

                                    return resultList;
                                }}
                            </div>
                        );
                    } else {
                        resultList.push(
                            <div class="loading_wrapper">
                                <i class="cls_icon">update</i>
                            </div>
                        );
                    }

                    return resultList;
                }}
            </div>
        </div>
    );
};

export default viewDocument;
