import { jsxFactory, IvirtualNode } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelMcp from "../model/Mcp";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const viewMcp = (variableObject: modelMcp.Ivariable, methodObject: modelMcp.Imethod): IvirtualNode => {
    return <div class="view_mcp"></div>;
};

export default viewMcp;
