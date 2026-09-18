// Source
import type Chat from "../controller/Chat";

export interface IdataDocument {
    markdown: string;
    userPrompt: string;
    fileName: string;
    messageIndex: number;
}

export interface IdataContext {
    controllerChat: Chat;
    apiResponse: (mode?: string, prompt?: string) => void;
    apiResponseDocument: (documentObject: IdataDocument) => Promise<void>;
}

export interface IdataInputPrompt {
    resultUserPrompt: string;
    resultSystemPrompt: string;
}
