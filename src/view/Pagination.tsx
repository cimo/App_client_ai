import { jsxFactory, IvirtualNode } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelPagination from "../model/Pagination";

const viewPagination = (variableObject: modelPagination.Ivariable, methodObject: modelPagination.Imethod): IvirtualNode => {
    return (
        <div class="view_pagination">
            <button onClick={() => methodObject.onClickChangePage(-1)}>
                <i class="cls_icon">chevron_left</i>
            </button>
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
            <button onClick={() => methodObject.onClickChangePage(1)}>
                <i class="cls_icon">chevron_right</i>
            </button>
        </div>
    );
};

export default viewPagination;
