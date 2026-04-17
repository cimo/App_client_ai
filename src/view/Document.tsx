import { jsxFactory, IvirtualNode } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelDocument from "../model/Document";

const viewDocument = (variableObject: modelDocument.Ivariable, methodObject: modelDocument.Imethod): IvirtualNode => {
    return (
        <div class="view_document" jsmvcfw-controllerName="Document">
            <div class="container_html">
                <p>
                    <span class="page_index">
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
                        / {variableObject.pageTotal.state}
                    </span>
                </p>
                <iframe class="html" srcdoc={variableObject.fileContent.state} sandbox="allow-scripts"></iframe>
            </div>
        </div>
    );
};

export default viewDocument;
