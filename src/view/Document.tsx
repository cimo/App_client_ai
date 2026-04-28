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
                        <input
                            type="text"
                            inputmode="numeric"
                            pattern="[0-9]*"
                            value={variableObject.pageNumber.state}
                            onClick={(event: Event) => {
                                event.stopPropagation();
                            }}
                            onInput={(event: Event) => {
                                methodObject.onInputChangePage(event);
                            }}
                        />
                        <span>/</span>
                        <span class="page_total">{variableObject.pageTotal.state}</span>
                    </p>
                </div>
                <iframe class="html" srcdoc={variableObject.fileContent.state} sandbox="allow-scripts"></iframe>
            </div>
        </div>
    );
};

export default viewDocument;
