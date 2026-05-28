import { jsxFactory, jsxFragment, IvirtualNode } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelDocument from "../model/Document";

const viewDocument = (variableObject: modelDocument.Ivariable, methodObject: modelDocument.Imethod): IvirtualNode => {
    return (
        <div class="view_document" jsmvcfw-controllerName="Document">
            <aside jsmvcfw-controllerName="Mcp" />
            <div class="main_container">
                {(() => {
                    const result: IvirtualNode[] = [];

                    if (variableObject.isLoadingWindow.state || variableObject.isLoadingPage.state) {
                        result.push(
                            <div class="loading_container">
                                <i class="cls_icon">update</i>
                                <p>Loading...</p>
                            </div>
                        );
                    } else {
                        result.push(
                            <>
                                <div class="pagination_container">
                                    <i class="cls_icon" onClick={() => methodObject.onClickChangePage(-1)}>
                                        chevron_left
                                    </i>
                                    <input
                                        type="text"
                                        inputmode="numeric"
                                        pattern="[0-9]*"
                                        value={variableObject.pageNumber.state}
                                        onKeyUp={(event: KeyboardEvent) => {
                                            methodObject.onInputChangePage(event);
                                        }}
                                        jsmvcfw-elementHookName="elementInputPageNumber"
                                    />
                                    <span>/</span>
                                    <span class="page_total">{variableObject.pageTotal.state}</span>
                                    <i class="cls_icon" onClick={() => methodObject.onClickChangePage(1)}>
                                        chevron_right
                                    </i>
                                </div>
                                <div class="data_container">
                                    {(() => {
                                        const result: IvirtualNode[] = [];

                                        if (!variableObject.isPageExist.state) {
                                            result.push(
                                                <div class="message_container">
                                                    <i class="cls_icon">error</i>
                                                    <p>Page does not exist</p>
                                                </div>
                                            );
                                        } else if (variableObject.htmlContent.state !== "") {
                                            result.push(<iframe srcdoc={variableObject.htmlContent.state} sandbox="allow-scripts"></iframe>);
                                        } else if (variableObject.imageContent.state !== "") {
                                            result.push(<img src={`data:image/png;base64,${variableObject.imageContent.state}`} />);
                                        }

                                        return result;
                                    })()}
                                </div>
                            </>
                        );
                    }

                    return result;
                })()}
            </div>
        </div>
    );
};

export default viewDocument;
