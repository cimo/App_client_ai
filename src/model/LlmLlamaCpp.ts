// Source
import * as modelMcp from "./Mcp";

export interface IapiModelBody {
    response: {
        stdout: string;
        stderr: string | Error;
    };
}

export interface IapiLlmBody {
    stream: boolean;
    model: string;
    input: IdataInput[];
    tools: unknown[];
    temperature?: number;
}

export interface IapiLlmResponse {
    type: string;
    response: {
        id: string;
        output: [
            {
                id: string;
                type: string;
                status: string;
                content: [
                    {
                        type: string;
                        text: string;
                    }
                ];
            }
        ];
    };
    error: {
        message: string;
    };
    delta: string;
    item: modelMcp.ItoolBody;
}

export interface IdataInput {
    role: string;
    content: string | Array<{ type: string; text?: string; image_url?: string }>;
}
