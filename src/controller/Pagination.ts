import { Icontroller, IvirtualNode, variableBind, IvariableEffect } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelPagination from "../model/Pagination";
import viewPagination from "../view/Pagination";

export default class Pagination implements Icontroller {
    // Variable
    private variableObject: modelPagination.Ivariable;
    private methodObject: modelPagination.Imethod;

    private itemMax = 10;

    // Method
    private onClickChangePage = (index: number): void => {
        let pageNumber = this.variableObject.pageNumber.state + index;

        if (pageNumber < 1) {
            pageNumber = 1;
        } else if (pageNumber > this.variableObject.pageTotal.state) {
            pageNumber = this.variableObject.pageTotal.state;
        }

        this.variableObject.pageNumber.state = pageNumber;
    };

    private onInputChangePage = (event: KeyboardEvent): void => {
        const elementInputValue = this.hookObject.elementInputPageNumber.value.replace(/\D+/g, "");
        this.hookObject.elementInputPageNumber.value = elementInputValue;

        if (event.key === "Enter") {
            this.variableObject.pageNumber.state = !isNaN(parseInt(elementInputValue)) ? parseInt(elementInputValue) : 1;
        }
    };

    updateList = <T>(list: T[]): T[] => {
        this.variableObject.pageTotal.state = Math.max(1, Math.ceil(list.length / this.itemMax));

        if (this.variableObject.pageNumber.state > this.variableObject.pageTotal.state) {
            this.variableObject.pageNumber.state = this.variableObject.pageTotal.state;
        }

        const start = (this.variableObject.pageNumber.state - 1) * this.itemMax;

        return list.slice(start, start + this.itemMax);
    };

    constructor() {
        this.variableObject = {} as modelPagination.Ivariable;
        this.methodObject = {} as modelPagination.Imethod;
    }

    hookObject = {} as modelPagination.IelementHook;

    variable(): void {
        this.variableObject = variableBind(
            {
                pageNumber: 1,
                pageTotal: 1
            },
            this.constructor.name
        );

        this.methodObject = {
            onClickChangePage: this.onClickChangePage,
            onInputChangePage: this.onInputChangePage
        };
    }

    variableEffect(watch: IvariableEffect): void {
        watch([]);
    }

    view(): IvirtualNode {
        return viewPagination(this.variableObject, this.methodObject);
    }

    event(): void {}

    subControllerList(): Icontroller[] {
        return [];
    }

    rendered(): void {}

    destroy(): void {}
}
