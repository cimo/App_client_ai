import { jsxFactory, jsxFragment, IvirtualNode } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelDocument from "../model/Document";

const viewDocument = (variableObject: modelDocument.Ivariable, methodObject: modelDocument.Imethod): IvirtualNode => {
    return (
        <div class="view_document" jsmvcfw-controllerName="Document">
            <aside jsmvcfw-controllerName="Mcp" />
            <div class="container_file">
                {(() => {
                    const result: IvirtualNode[] = [];

                    if (variableObject.htmlContent.state !== "") {
                        result.push(
                            <>
                                <div>
                                    <p class="container_page">
                                        <i class="cls_icon" onClick={() => methodObject.onClickChangePage(-1)}>
                                            chevron_left
                                        </i>
                                        <input
                                            type="text"
                                            inputmode="numeric"
                                            pattern="[0-9]*"
                                            value={variableObject.pageNumber.state}
                                            onInput={() => {
                                                methodObject.onInputChangePage();
                                            }}
                                            jsmvcfw-elementHookName="elementInputPageNumber"
                                        />
                                        <span>/</span>
                                        <span class="page_total">{variableObject.pageTotal.state}</span>
                                        <i class="cls_icon" onClick={() => methodObject.onClickChangePage(1)}>
                                            chevron_right
                                        </i>
                                    </p>
                                </div>
                                <iframe class="html" srcdoc={variableObject.htmlContent.state} sandbox="allow-scripts"></iframe>
                            </>
                        );
                    } else if (variableObject.imageContent.state !== "") {
                        result.push(<img src={`data:image/png;base64,${variableObject.imageContent.state}`} />);
                    }

                    return result;
                })()}
            </div>
        </div>
    );
};

export default viewDocument;
