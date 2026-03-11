import { jsxFactory, IvirtualNode } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelAi from "../model/Ai";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const viewAi = (variableObject: modelAi.Ivariable, methodObject: modelAi.Imethod): IvirtualNode => {
    return <div class="view_ai"></div>;
};

export default viewAi;
