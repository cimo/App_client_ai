import { getAppLabel, readStorage, writeStorage, deleteStorage } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelSession from "./model/Session";

export const data: modelSession.Idata = {
    mcpSessionId: readStorage<string>("mcp-session-id") || "",
    mcpCookie: readStorage<string>("mcp-cookie") || "",
    mcpBearerToken: readStorage<string>("mcp-bearer-token") || "",
    aiCookie: readStorage<string>("ai-cookie") || "",
    msAutomateTestCookie: readStorage<string>("ms-automate-test") || ""
};

export const syncFromStorage = (): void => {
    data.mcpSessionId = readStorage<string>("mcp-session-id") || "";
    data.mcpCookie = readStorage<string>("mcp-cookie") || "";
    data.mcpBearerToken = readStorage<string>("mcp-bearer-token") || "";
    data.aiCookie = readStorage<string>("ai-cookie") || "";
    data.msAutomateTestCookie = readStorage<string>("ms-automate-test") || "";
};

export const writeAiSession = (cookie: string): void => {
    data.aiCookie = cookie;

    writeStorage("ai-cookie", cookie);
};

export const deleteAiSession = (): void => {
    data.aiCookie = "";

    deleteStorage("ai-cookie");
};

export const writeMcpSession = (id: string, cookie: string, mcpBearerToken: string): void => {
    data.mcpSessionId = id;
    data.mcpCookie = cookie;
    data.mcpBearerToken = mcpBearerToken;

    writeStorage("mcp-session-id", id);
    writeStorage("mcp-cookie", cookie);
    writeStorage("mcp-bearer-token", mcpBearerToken);
};

export const deleteMcpSession = (): void => {
    data.mcpSessionId = "";
    data.mcpCookie = "";
    data.mcpBearerToken = "";

    deleteStorage("mcp-session-id");
    deleteStorage("mcp-cookie");
    deleteStorage("mcp-bearer-token");
};

export const writeMsAutomateTestSession = (cookie: string): void => {
    data.msAutomateTestCookie = cookie;

    writeStorage("ms-automate-test", cookie);
};

export const deleteMsAutomateTestSession = (): void => {
    data.msAutomateTestCookie = "";

    deleteStorage("ms-automate-test");
};

window.addEventListener("storage", (event: StorageEvent) => {
    if (!event.key) return;

    const appLabel = getAppLabel();

    if (event.key === `${appLabel}_mcp-session-id`) {
        data.mcpSessionId = readStorage<string>("mcp-session-id") || "";
    }

    if (event.key === `${appLabel}_mcp-cookie`) {
        data.mcpCookie = readStorage<string>("mcp-cookie") || "";
    }

    if (event.key === `${appLabel}_mcp-bearer-token`) {
        data.mcpBearerToken = readStorage<string>("mcp-bearer-token") || "";
    }

    if (event.key === `${appLabel}_ai-cookie`) {
        data.aiCookie = readStorage<string>("ai-cookie") || "";
    }

    if (event.key === `${appLabel}_ms-automate-test`) {
        data.msAutomateTestCookie = readStorage<string>("ms-automate-test") || "";
    }
});
