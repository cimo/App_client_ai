import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { emitTo, listen } from "@tauri-apps/api/event";
import { confirm } from "@tauri-apps/plugin-dialog";

// Source
import * as modelHelperSrc from "./model/HelperSrc";

declare const IS_DEPLOY_DEV: string;

export const PATH_ROOT = "/home/app/";
export const IS_DEBUG = IS_DEPLOY_DEV;
export const PATH_LOG = "log/";
export const LOCALE = "jp";
export const URL_AI = IS_DEPLOY_DEV === "true" ? "https://host.docker.internal:1046" : "https://localhost:1046";
export const URL_MCP = IS_DEPLOY_DEV === "true" ? "https://host.docker.internal:1047" : "https://localhost:1047";

export const localeConfiguration: Record<string, { locale: string; currency: string; dateFormat: string }> = {
    // Asia
    jp: { locale: "ja-JP", currency: "JPY", dateFormat: "a" },
    cn: { locale: "zh-CN", currency: "CNY", dateFormat: "a" },
    tw: { locale: "zh-TW", currency: "TWD", dateFormat: "a" },
    kr: { locale: "ko-KR", currency: "KRW", dateFormat: "a" },
    in: { locale: "hi-IN", currency: "INR", dateFormat: "a" },
    th: { locale: "th-TH", currency: "THB", dateFormat: "a" },
    // Europe
    it: { locale: "it-IT", currency: "EUR", dateFormat: "b" },
    fr: { locale: "fr-FR", currency: "EUR", dateFormat: "b" },
    de: { locale: "de-DE", currency: "EUR", dateFormat: "b" },
    es: { locale: "es-ES", currency: "EUR", dateFormat: "b" },
    pt: { locale: "pt-PT", currency: "EUR", dateFormat: "b" },
    nl: { locale: "nl-NL", currency: "EUR", dateFormat: "b" },
    ru: { locale: "ru-RU", currency: "RUB", dateFormat: "b" },
    pl: { locale: "pl-PL", currency: "PLN", dateFormat: "b" },
    sv: { locale: "sv-SE", currency: "SEK", dateFormat: "b" },
    // America
    us: { locale: "en-US", currency: "USD", dateFormat: "c" },
    mx: { locale: "es-MX", currency: "MXN", dateFormat: "c" },
    br: { locale: "pt-BR", currency: "BRL", dateFormat: "c" },
    ca: { locale: "fr-CA", currency: "CAD", dateFormat: "c" },
    // Africa
    ke: { locale: "sw-KE", currency: "KES", dateFormat: "c" },
    za: { locale: "af-ZA", currency: "ZAR", dateFormat: "c" },
    eg: { locale: "ar-EG", currency: "EGP", dateFormat: "c" },
    // Oceania
    au: { locale: "en-AU", currency: "AUD", dateFormat: "c" },
    nz: { locale: "mi-NZ", currency: "NZD", dateFormat: "c" }
};

export const localeFormat = (value: number | Date, isMonth = true, isDay = true, isTime = true): string | undefined => {
    if (typeof value === "number") {
        const formatOption: Intl.NumberFormatOptions = {
            style: "decimal",
            currency: localeConfiguration[LOCALE].currency
        };

        return new Intl.NumberFormat(localeConfiguration[LOCALE].locale, formatOption).format(value);
    } else if (value instanceof Date) {
        let formatOption: Intl.DateTimeFormatOptions = {
            year: "numeric"
        };

        if (isMonth) {
            formatOption.month = "numeric";
        }

        if (isDay) {
            formatOption.day = "numeric";
        }

        if (isTime) {
            formatOption.hour = "2-digit";
            formatOption.minute = "2-digit";
            formatOption.second = "2-digit";
            formatOption.hour12 = false;
        }

        let result = new Intl.DateTimeFormat(localeConfiguration[LOCALE].locale, formatOption).format(value);

        if (!isMonth && !isDay && !isTime) {
            result = parseInt(result).toString();
        }

        return result;
    }

    return undefined;
};

export const writeLog = (tag: string, value: string | Record<string, unknown> | Error): void => {
    if (IS_DEBUG === "true") {
        // eslint-disable-next-line no-console
        console.log(`WriteLog => ${tag}: `, value);
    }
};

export const generateUniqueId = (): string => {
    const timestamp = Date.now().toString(36);
    const randomPart = crypto.getRandomValues(new Uint32Array(1))[0].toString(36);

    return `${timestamp}-${randomPart}`;
};

export const readMimeType = (value: Uint8Array | string): modelHelperSrc.ImimeType => {
    let result = { content: "", extension: "", type: "" };

    let toHex = undefined;
    let toLatin1 = undefined;
    let extension = undefined;

    if (value instanceof Uint8Array) {
        toHex = (value: Uint8Array) => {
            let out = "";

            for (let a = 0; a < value.length; a++) {
                out += value[a].toString(16).padStart(2, "0");
            }

            return out;
        };

        toLatin1 = (value: Uint8Array) => {
            const chunk = 0x8000;

            let result = "";

            for (let a = 0; a < value.length; a += chunk) {
                const subChunk = value.subarray(a, a + chunk);

                result += String.fromCharCode(...subChunk);
            }

            return result;
        };
    } else {
        extension = value.toLowerCase().trim().split(".").pop();
    }

    if ((value instanceof Uint8Array && toHex != undefined && toHex(value.subarray(0, 4)) === "25504446") || extension === "pdf") {
        result = { content: "application/pdf", extension: "pdf", type: "application" };
    } else if (
        (value instanceof Uint8Array && toHex != undefined && toHex(value.subarray(0, 3)) === "ffd8ff") ||
        extension === "jpg" ||
        extension === "jpeg"
    ) {
        result = { content: "image/jpeg", extension: "jpg", type: "image" };
    } else if ((value instanceof Uint8Array && toHex != undefined && toHex(value.subarray(0, 8)) === "89504e470d0a1a0a") || extension === "png") {
        result = { content: "image/png", extension: "png", type: "image" };
    } else if ((value instanceof Uint8Array && toHex != undefined && toHex(value.subarray(0, 6)) === "474946383761") || extension === "gif") {
        result = { content: "image/gif", extension: "gif", type: "image" };
    } else if (
        (value instanceof Uint8Array &&
            toHex != undefined &&
            toHex(value.subarray(0, 4)) === "52494646" &&
            toHex(value.subarray(8, 12)) === "57454250") ||
        extension === "webp"
    ) {
        result = { content: "image/webp", extension: "webp", type: "image" };
    } else if ((value instanceof Uint8Array && toHex != undefined && toHex(value.subarray(0, 2)) === "424d") || extension === "bmp") {
        result = { content: "image/bmp", extension: "bmp", type: "image" };
    } else if (
        (value instanceof Uint8Array &&
            toHex != undefined &&
            (toHex(value.subarray(0, 4)) === "49492a00" || toHex(value.subarray(0, 4)) === "4d4d002a")) ||
        extension === "tif" ||
        extension === "tiff"
    ) {
        result = { content: "image/tiff", extension: "tiff", type: "image" };
    } else if (
        (value instanceof Uint8Array &&
            toHex != undefined &&
            (toHex(value.subarray(0, 4)) === "00000100" || toHex(value.subarray(0, 4)) === "00000200")) ||
        extension === "ico"
    ) {
        result = { content: "image/x-icon", extension: "ico", type: "image" };
    } else if (extension === "svg" || extension === "svg+xml") {
        result = { content: "image/svg+xml", extension: "svg", type: "image" };
    } else if (extension === "avif") {
        result = { content: "image/avif", extension: "avif", type: "image" };
    } else {
        let headByte = undefined;
        let head = "";

        if (value instanceof Uint8Array && toHex != undefined) {
            headByte = value.subarray(0, Math.min(value.length, 64 * 1024));

            if (toLatin1 != undefined) {
                head = toLatin1(headByte);
            }
        }

        if (head.includes("word/") || extension === "docx") {
            result = {
                content: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                extension: "docx",
                type: "application"
            };
        } else if (head.includes("xl/") || extension === "xlsx") {
            result = {
                content: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                extension: "xlsx",
                type: "application"
            };
        } else if (head.includes("ppt/") || extension === "pptx") {
            result = {
                content: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                extension: "pptx",
                type: "application"
            };
        } else if ((value instanceof Uint8Array && toHex != undefined && toHex(value.subarray(0, 4)) === "504b0304") || extension === "zip") {
            result = { content: "application/zip", extension: "zip", type: "application" };
        }
    }

    return result;
};

export const findElementParent = (element: HTMLElement, className: string): HTMLElement | null => {
    if (!element.parentNode || element.parentNode === document) {
        return null;
    }

    if (element && element.classList.contains(className)) {
        return element;
    }

    return findElementParent(element.parentNode as HTMLElement, className);
};

export const isJson = (value: string): boolean => {
    try {
        JSON.parse(value);

        return true;
    } catch {
        return false;
    }
};

export const baseFileName = (fileName: string): string => {
    const nameList = fileName.split("/");
    const nameWithExtension = nameList[nameList.length - 1];
    const baseName = nameWithExtension.trim().replace(/.[^/.]+$/, "");

    return baseName;
};

export const appWindowLabelUnique = (label: string, title: string): string => {
    const safeName = title
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

    return `${label}-${safeName}`;
};

export const openWindow = async (label: string, title: string, route: string): Promise<WebviewWindow> => {
    const uniqueLabel = appWindowLabelUnique(label, title);
    const window = await WebviewWindow.getByLabel(uniqueLabel);

    if (window) {
        await window.unminimize();
        await window.show();
        await window.setAlwaysOnTop(true);

        await window.setFocus();

        return window;
    }

    const unlisten = await listen<string>(`window-${uniqueLabel}-ready`, async () => {
        await emitTo(uniqueLabel, "window-init", route);

        unlisten();
    });

    return new WebviewWindow(uniqueLabel, {
        title: title,
        url: route,
        decorations: true,
        resizable: true,
        width: 750,
        height: 1000,
        minWidth: 750,
        minHeight: 1050,
        center: true,
        focus: true
    });
};

export const confirmDialog = async (
    message: string,
    title: string,
    kind: "info" | "warning" | "error" | undefined,
    okLabel: string,
    cancelLabel: string
): Promise<boolean> => {
    return await confirm(message, {
        title,
        kind,
        okLabel,
        cancelLabel
    });
};
