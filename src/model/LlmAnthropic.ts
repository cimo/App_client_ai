export interface IapiModelBody {
    data: [
        {
            id: string;
            type: string;
        }
    ];
}

export interface IapiLlmBody {
    max_tokens: number;
    stream: boolean;
    model: string;
    system: IdataSystem[];
    messages: IdataMessage[];
    tools: unknown[];
}

export interface IapiLlmResponse {
    type: string;
    error: {
        message: string;
    };
    delta: {
        type: string;
        thinking?: string;
        text?: string;
    };
}

export interface IdataMessage {
    role: string;
    content: string | Array<{ type: string; text?: string; source?: { type: string; media_type?: string; data?: string; url?: string } }>;
}

export interface IdataSystem {
    text: string;
    type: string;
}
