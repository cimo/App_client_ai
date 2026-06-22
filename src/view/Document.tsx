import { jsxFactory, jsxFragment, IvirtualNode } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelDocument from "../model/Document";

const viewDocument = (variableObject: modelDocument.Ivariable, methodObject: modelDocument.Imethod): IvirtualNode => {
    return (
        <div class="view_document" jsmvcfw-controllerName="Document">
            <aside jsmvcfw-controllerName="Mcp" />
            <div class="main_wrapper">
                {(() => {
                    const resultList: IvirtualNode[] = [];

                    if (variableObject.isLoadingWindow.state || variableObject.isLoadingPage.state) {
                        resultList.push(
                            <div class="loading_wrapper">
                                <i class="cls_icon">update</i>
                            </div>
                        );
                    } else {
                        resultList.push(
                            <>
                                <div class="pagination_wrapper">
                                    <i class="cls_icon" onClick={(event: Event) => methodObject.onClickChangePage(event, -1)}>
                                        chevron_left
                                    </i>
                                    <input
                                        type="text"
                                        value={variableObject.pageNumber.state}
                                        onKeyUp={(event: KeyboardEvent) => {
                                            methodObject.onInputChangePage(event);
                                        }}
                                        jsmvcfw-elementHookName="elementInputPageNumber"
                                    />
                                    <span>/</span>
                                    <span class="page_total">{variableObject.pageTotal.state}</span>
                                    <i class="cls_icon" onClick={(event: Event) => methodObject.onClickChangePage(event, 1)}>
                                        chevron_right
                                    </i>
                                </div>
                                <div class="data_wrapper">
                                    {(() => {
                                        const resultList: IvirtualNode[] = [];

                                        if (!variableObject.isPageExist.state) {
                                            resultList.push(
                                                <div class="message_wrapper">
                                                    <i class="cls_icon">error</i>
                                                    <p>Page does not exist</p>
                                                </div>
                                            );
                                        } else if (variableObject.htmlContent.state !== "") {
                                            resultList.push(<iframe srcdoc={variableObject.htmlContent.state} sandbox="allow-scripts"></iframe>);
                                        } else if (variableObject.imageContent.state !== "") {
                                            resultList.push(<img src={`data:image/png;base64,${variableObject.imageContent.state}`} />);
                                        }

                                        return resultList;
                                    })()}
                                </div>
                            </>
                        );
                    }

                    return resultList;
                })()}
            </div>
        </div>
    );
};

export default viewDocument;
