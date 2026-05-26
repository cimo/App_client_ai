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

                    if (variableObject.isLoadingWindow.state) {
                        result.push(
                            <div key="0" class="over_container">
                                <div>
                                    <i class="cls_icon">update</i>
                                    <p>Loading...</p>
                                </div>
                            </div>
                        );
                    } else {
                        result.push(
                            <>
                                <div key="1" class="pagination_container">
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

                                        if (variableObject.isLoadingPage.state) {
                                            result.push(
                                                <div class="over_container">
                                                    <div>
                                                        <i class="cls_icon">update</i>
                                                        <p>Loading...</p>
                                                    </div>
                                                </div>
                                            );

                                            return result;
                                        } else if (!variableObject.isPageExist.state) {
                                            result.push(
                                                <div class="over_container">
                                                    <div>
                                                        <i class="cls_icon">error</i>
                                                        <p>Page does not exist</p>
                                                    </div>
                                                </div>
                                            );

                                            return result;
                                        }

                                        if (variableObject.contentHtml.state !== "") {
                                            result.push(<iframe srcdoc={variableObject.contentHtml.state} sandbox="allow-scripts"></iframe>);
                                        } else if (variableObject.contentImage.state !== "") {
                                            result.push(<img src={`data:image/png;base64,${variableObject.contentImage.state}`} />);
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
