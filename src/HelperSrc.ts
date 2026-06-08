import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { WebviewOptions } from "@tauri-apps/api/webview";
import { emitTo, listen } from "@tauri-apps/api/event";
import { WindowOptions } from "@tauri-apps/api/window";

// Source
import * as modelHelperSrc from "./model/HelperSrc";

declare const IS_DEPLOY_DEV: string;

export const IS_DEBUG = IS_DEPLOY_DEV;
export const URL_AI = IS_DEPLOY_DEV === "true" ? "https://host.docker.internal:1046" : "https://localhost:1046";
export const URL_MCP = IS_DEPLOY_DEV === "true" ? "https://host.docker.internal:1047" : "https://localhost:1047";

// Custom
// Custom

const fileSize = (value: Uint8Array | number, isOnlyByte = true): string => {
    let result = "";

    const byte = typeof value === "number" ? value : value.length;

    if (isOnlyByte) {
        return byte.toString();
    }

    if (byte < 1024) {
        result = byte + " B";
    } else if (byte < 1048576) {
        result = (byte / 1024).toFixed(1) + " KB";
    } else if (byte < 1073741824) {
        result = (byte / 1048576).toFixed(1) + " MB";
    } else if (byte < 1099511627776) {
        result = (byte / 1073741824).toFixed(1) + " GB";
    } else {
        result = (byte / 1099511627776).toFixed(1) + " TB";
    }

    return result;
};

export const localeConfigurationObject: modelHelperSrc.IlocaleConfiguration = {
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

export const LOCALE = "jp";

export const localeFormat = (value: number | Date, isMonth = true, isDay = true, isTime = true): string | undefined => {
    if (typeof value === "number") {
        const formatOption: Intl.NumberFormatOptions = {
            style: "decimal",
            currency: localeConfigurationObject[LOCALE].currency
        };

        return new Intl.NumberFormat(localeConfigurationObject[LOCALE].locale, formatOption).format(value);
    } else if (value instanceof Date && !isNaN(value.getTime())) {
        let result = "";

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

        result = new Intl.DateTimeFormat(localeConfigurationObject[LOCALE].locale, formatOption).format(value);

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

export const isJson = (value: string): boolean => {
    try {
        JSON.parse(value);

        return true;
    } catch {
        return false;
    }
};

export const fileDetail = (value: string, buffer?: Uint8Array, isOnlyByte = true): modelHelperSrc.IfileDetail => {
    let resultObject = {} as modelHelperSrc.IfileDetail;

    if (!value) {
        return resultObject;
    }

    const fileNameWithExtension = value.includes("/") ? value.split("/").pop()! : value;
    const baseName = fileNameWithExtension.trim().replace(/\.[^/.]+$/, "");

    const signatureList: modelHelperSrc.IfileDetailSignature[] = [
        { mimeType: "text/javascript", extension: "js", category: "code" },
        { mimeType: "text/javascript", extension: "jsx", category: "code" },
        { mimeType: "text/javascript", extension: "mjs", category: "code" },
        { mimeType: "text/typescript", extension: "ts", category: "code" },
        { mimeType: "text/typescript", extension: "tsx", category: "code" },
        { mimeType: "text/x-python", extension: "py", category: "code" },
        { mimeType: "text/css", extension: "css", category: "code" },
        { mimeType: "text/html", extension: "html", category: "code" },
        { mimeType: "text/html", extension: "htm", category: "code" },
        { mimeType: "text/csv", extension: "csv", category: "text" },
        { mimeType: "text/plain", extension: "txt", category: "text" },
        { mimeType: "text/xml", extension: "xml", category: "code" },
        { mimeType: "text/markdown", extension: "md", category: "code" },
        { mimeType: "text/yaml", extension: "yaml", category: "code" },
        { mimeType: "text/yaml", extension: "yml", category: "code" },
        { mimeType: "text/x-sh", extension: "sh", category: "code" },
        { mimeType: "font/ttf", extension: "ttf", category: "font", magicByteList: [{ offset: 0, bytes: [0x00, 0x01, 0x00, 0x00, 0x00] }] },
        { mimeType: "font/otf", extension: "otf", category: "font", magicByteList: [{ offset: 0, bytes: [0x4f, 0x54, 0x54, 0x4f] }] },
        { mimeType: "font/woff", extension: "woff", category: "font", magicByteList: [{ offset: 0, bytes: [0x77, 0x4f, 0x46, 0x46] }] },
        { mimeType: "font/woff2", extension: "woff2", category: "font", magicByteList: [{ offset: 0, bytes: [0x77, 0x4f, 0x46, 0x32] }] },
        { mimeType: "image/jpeg", extension: "jpg", category: "image", magicByteList: [{ offset: 0, bytes: [0xff, 0xd8, 0xff] }] },
        { mimeType: "image/jpeg", extension: "jpeg", category: "image" },
        {
            mimeType: "image/png",
            extension: "png",
            category: "image",
            magicByteList: [{ offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }]
        },
        { mimeType: "image/gif", extension: "gif", category: "image", magicByteList: [{ offset: 0, bytes: [0x47, 0x49, 0x46, 0x38] }] },
        {
            mimeType: "image/webp",
            extension: "webp",
            category: "image",
            magicByteList: [
                { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] },
                { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] }
            ]
        },
        { mimeType: "image/bmp", extension: "bmp", category: "image", magicByteList: [{ offset: 0, bytes: [0x42, 0x4d] }] },
        { mimeType: "image/tiff", extension: "tiff", category: "image", magicByteList: [{ offset: 0, bytes: [0x49, 0x49, 0x2a, 0x00] }] },
        { mimeType: "image/tiff", extension: "tiff", category: "image", magicByteList: [{ offset: 0, bytes: [0x4d, 0x4d, 0x00, 0x2a] }] },
        { mimeType: "image/x-icon", extension: "ico", category: "image", magicByteList: [{ offset: 0, bytes: [0x00, 0x00, 0x01, 0x00] }] },
        {
            mimeType: "image/avif",
            extension: "avif",
            category: "image",
            magicByteList: [{ offset: 4, bytes: [0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66] }]
        },
        {
            mimeType: "image/avif",
            extension: "avif",
            category: "image",
            magicByteList: [{ offset: 4, bytes: [0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x73] }]
        },
        { mimeType: "image/svg+xml", extension: "svg", category: "image" },
        { mimeType: "audio/mpeg", extension: "mp3", category: "audio", magicByteList: [{ offset: 0, bytes: [0x49, 0x44, 0x33] }] },
        { mimeType: "audio/mpeg", extension: "mp3", category: "audio", magicByteList: [{ offset: 0, bytes: [0xff, 0xfb] }] },
        {
            mimeType: "audio/wav",
            extension: "wav",
            category: "audio",
            magicByteList: [
                { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] },
                { offset: 8, bytes: [0x57, 0x41, 0x56, 0x45] }
            ]
        },
        { mimeType: "audio/ogg", extension: "ogg", category: "audio", magicByteList: [{ offset: 0, bytes: [0x4f, 0x67, 0x67, 0x53] }] },
        { mimeType: "audio/flac", extension: "flac", category: "audio", magicByteList: [{ offset: 0, bytes: [0x66, 0x4c, 0x61, 0x43] }] },
        { mimeType: "video/mp4", extension: "mp4", category: "video", magicByteList: [{ offset: 4, bytes: [0x66, 0x74, 0x79, 0x70] }] },
        {
            mimeType: "video/avi",
            extension: "avi",
            category: "video",
            magicByteList: [
                { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] },
                { offset: 8, bytes: [0x41, 0x56, 0x49, 0x20] }
            ]
        },
        { mimeType: "video/webm", extension: "webm", category: "video", magicByteList: [{ offset: 0, bytes: [0x1a, 0x45, 0xdf, 0xa3] }] },
        { mimeType: "application/pdf", extension: "pdf", category: "document", magicByteList: [{ offset: 0, bytes: [0x25, 0x50, 0x44, 0x46] }] },
        { mimeType: "application/msword", extension: "doc", category: "document" },
        { mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", extension: "docx", category: "document" },
        { mimeType: "application/vnd.ms-excel", extension: "xls", category: "document" },
        { mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", extension: "xlsx", category: "document" },
        { mimeType: "application/vnd.ms-powerpoint", extension: "ppt", category: "document" },
        { mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation", extension: "pptx", category: "document" },
        { mimeType: "application/vnd.oasis.opendocument.text", extension: "odt", category: "document" },
        { mimeType: "application/vnd.oasis.opendocument.spreadsheet", extension: "ods", category: "document" },
        { mimeType: "application/vnd.oasis.opendocument.presentation", extension: "odp", category: "document" },
        { mimeType: "application/zip", extension: "zip", category: "archive", magicByteList: [{ offset: 0, bytes: [0x50, 0x4b, 0x03, 0x04] }] },
        {
            mimeType: "application/x-rar-compressed",
            extension: "rar",
            category: "archive",
            magicByteList: [{ offset: 0, bytes: [0x52, 0x61, 0x72, 0x21, 0x1a, 0x07] }]
        },
        {
            mimeType: "application/x-7z-compressed",
            extension: "7z",
            category: "archive",
            magicByteList: [{ offset: 0, bytes: [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c] }]
        },
        { mimeType: "application/gzip", extension: "gz", category: "archive", magicByteList: [{ offset: 0, bytes: [0x1f, 0x8b] }] },
        { mimeType: "application/x-bzip2", extension: "bz2", category: "archive", magicByteList: [{ offset: 0, bytes: [0x42, 0x5a, 0x68] }] },
        {
            mimeType: "application/x-xz",
            extension: "xz",
            category: "archive",
            magicByteList: [{ offset: 0, bytes: [0xfd, 0x37, 0x7a, 0x58, 0x5a, 0x00] }]
        },
        { mimeType: "application/json", extension: "json", category: "code" },
        { mimeType: "application/x-msdownload", extension: "exe", category: "executable", magicByteList: [{ offset: 0, bytes: [0x4d, 0x5a] }] },
        {
            mimeType: "application/x-elf",
            extension: "elf",
            category: "executable",
            magicByteList: [{ offset: 0, bytes: [0x7f, 0x45, 0x4c, 0x46] }]
        },
        {
            mimeType: "application/wasm",
            extension: "wasm",
            category: "executable",
            magicByteList: [{ offset: 0, bytes: [0x00, 0x61, 0x73, 0x6d] }]
        },
        {
            mimeType: "application/x-sqlite3",
            extension: "db",
            category: "database",
            magicByteList: [{ offset: 0, bytes: [0x53, 0x51, 0x4c, 0x69, 0x74, 0x65, 0x20] }]
        }
    ];

    if (buffer) {
        for (let a = 0; a < signatureList.length; a++) {
            const magicByteList = signatureList[a].magicByteList;

            if (!magicByteList) {
                continue;
            }

            let isMatched = false;

            for (let b = 0; b < magicByteList.length; b++) {
                const check = magicByteList[b];

                if (buffer.length < check.offset + check.bytes.length) {
                    isMatched = false;

                    break;
                }

                isMatched = true;

                for (let c = 0; c < check.bytes.length; c++) {
                    if (buffer[check.offset + c] !== check.bytes[c]) {
                        isMatched = false;

                        break;
                    }
                }

                if (!isMatched) {
                    break;
                }
            }

            if (isMatched) {
                resultObject = {
                    ...resultObject,
                    fileName: fileNameWithExtension,
                    baseName,
                    mimeType: signatureList[a].mimeType,
                    extension: signatureList[a].extension,
                    category: signatureList[a].category,
                    size: fileSize(buffer, isOnlyByte)
                };
            }
        }
    }

    if ((!resultObject.mimeType || resultObject.mimeType === "application/zip") && value !== "") {
        const extensionIndex = value.lastIndexOf(".");
        const extension = extensionIndex !== -1 ? value.slice(extensionIndex + 1).toLowerCase() : "";

        for (let a = 0; a < signatureList.length; a++) {
            if (signatureList[a].extension === extension) {
                resultObject = {
                    ...resultObject,
                    fileName: fileNameWithExtension,
                    baseName,
                    mimeType: signatureList[a].mimeType,
                    extension: signatureList[a].extension,
                    category: signatureList[a].category
                };

                break;
            }
        }
    }

    return resultObject;
};

// Custom
export const findElementParent = (element: HTMLElement, className: string): HTMLElement | null => {
    if (!element.parentNode || element.parentNode === document) {
        return null;
    }

    if (element && element.classList.contains(className)) {
        return element;
    }

    return findElementParent(element.parentNode as HTMLElement, className);
};

export const windowLabelUnique = (label: string, title: string): string => {
    const safeName = title
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

    return `${label}-${safeName}`;
};

export const windowOpen = async (
    label: string,
    title: string,
    route: string,
    windowOptions: Omit<WebviewOptions, "x" | "y" | "width" | "height"> & WindowOptions
): Promise<WebviewWindow> => {
    const windowLabel = windowLabelUnique(label, title);
    const window = await WebviewWindow.getByLabel(windowLabel);

    if (window) {
        await window.unminimize();
        await window.show();
        await window.setAlwaysOnTop(true);

        await window.setFocus();

        return window;
    }

    const unlistenWindowReady = await listen<string>(`window-${windowLabel}-ready`, async () => {
        await emitTo(windowLabel, "window-data", route);

        unlistenWindowReady();
    });

    return new WebviewWindow(windowLabel, windowOptions);
};
// Custom
