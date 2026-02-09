// Source
import * as InstanceMcp from "../InstanceMcp.js";
import * as helperSrc from "../HelperSrc.js";

export default class Mcp {
    // Variable

    // Method
    constructor() {}

    connection = async (uniqueId: string): Promise<void> => {
        await InstanceMcp.api
            .post<Response>(
                "/mcp",
                {
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json, text/event-stream",
                        "X-Session-Id": uniqueId
                    }
                },
                {
                    jsonrpc: "2.0",
                    id: 1,
                    method: "initialize",
                    params: {
                        protocolVersion: "2025-06-18",
                        capabilities: {},
                        clientInfo: { name: "curl", version: "1.0" }
                    }
                },
                false,
                true
            )
            .catch((error: Error) => {
                helperSrc.writeLog("Mcp.ts - connection() - catch()", error);
            });
    };
}
