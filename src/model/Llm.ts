// Source
import * as modelMcp from "./Mcp";

export interface IdataDocument {
    documentList: modelMcp.Idocument[];
    userPrompt: string;
    messageIndex: number;
}

export interface IdataInputPrompt {
    resultUserPrompt: string;
    resultSystemPrompt: string;
}
