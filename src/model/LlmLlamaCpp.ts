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
}

export interface IapiTokenDetailBody {
    model: string;
    text: string;
}

export interface IdataTokenDetail {
    count: number;
    contextSize: number;
}

export interface IdataResponseText {
    text: string;
    message: string;
}

export interface IdataInput {
    role: string;
    content: string | Array<{ type: string; text?: string; image_url?: string }>;
}
