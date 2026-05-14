import { jsxFactory, IvirtualNode } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelDocument from "../model/Document";

const viewDocument = (variableObject: modelDocument.Ivariable, methodObject: modelDocument.Imethod): IvirtualNode => {
    return (
        <div class="view_document" jsmvcfw-controllerName="Document">
            <aside jsmvcfw-controllerName="Mcp" />
            <div class="container_html">
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
                <iframe class="html" srcdoc={variableObject.fileContent.state} sandbox="allow-scripts"></iframe>
            </div>
        </div>
    );
};

export default viewDocument;
