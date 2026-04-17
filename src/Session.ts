import { getAppLabel, readStorage, writeStorage, deleteStorage } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelSession from "./model/Session";

export const data: modelSession.Idata = {
    aiBearerToken: readStorage<string>("ai-bearer-token") || "",
    aiCookie: readStorage<string>("ai-cookie") || "",
    mcpSessionId: readStorage<string>("mcp-session-id") || "",
    mcpCookie: readStorage<string>("mcp-cookie") || ""
};

export const syncFromStorage = (): void => {
    data.aiBearerToken = readStorage<string>("ai-bearer-token") || "";
    data.aiCookie = readStorage<string>("ai-cookie") || "";
    data.mcpSessionId = readStorage<string>("mcp-session-id") || "";
    data.mcpCookie = readStorage<string>("mcp-cookie") || "";
};

export const writeAiSession = (bearerToken: string, cookie: string): void => {
    data.aiBearerToken = bearerToken;
    data.aiCookie = cookie;

    writeStorage("ai-bearer-token", bearerToken);
    writeStorage("ai-cookie", cookie);
};

export const deleteAiSession = (): void => {
    data.aiBearerToken = "";
    data.aiCookie = "";

    deleteStorage("ai-bearer-token");
    deleteStorage("ai-cookie");
};

export const writeMcpSession = (sessionId: string, cookie: string): void => {
    data.mcpSessionId = sessionId;
    data.mcpCookie = cookie;

    writeStorage("mcp-session-id", sessionId);
    writeStorage("mcp-cookie", cookie);
};

export const deleteMcpSession = (): void => {
    data.mcpSessionId = "";
    data.mcpCookie = "";

    deleteStorage("mcp-session-id");
    deleteStorage("mcp-cookie");
};

window.addEventListener("storage", (event: StorageEvent) => {
    if (!event.key) return;

    const appLabel = getAppLabel();

    if (event.key === `${appLabel}_ai-bearer-token`) {
        data.aiBearerToken = readStorage<string>("ai-bearer-token") || "";
    }
    if (event.key === `${appLabel}_ai-cookie`) {
        data.aiCookie = readStorage<string>("ai-cookie") || "";
    }
    if (event.key === `${appLabel}_mcp-session-id`) {
        data.mcpSessionId = readStorage<string>("mcp-session-id") || "";
    }
    if (event.key === `${appLabel}_mcp-cookie`) {
        data.mcpCookie = readStorage<string>("mcp-cookie") || "";
    }
});
