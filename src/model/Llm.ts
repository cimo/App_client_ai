// Source
import type Chat from "../controller/Chat";

export interface IdataContext {
    controllerChat: Chat;
    apiResponse: (mode?: string, prompt?: string) => void;
}

export interface IdataInputPrompt {
    resultUserPrompt: string;
    resultSystemPrompt: string;
}
