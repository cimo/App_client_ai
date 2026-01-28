import Fs from "fs";

declare const IS_DEPLOY_DEV: string;

export const PATH_ROOT = "/home/app/";
export const IS_DEBUG = IS_DEPLOY_DEV;
export const PATH_LOG = "log/";
export const LOCALE = "jp";
export const URL_ENDPOINT = IS_DEPLOY_DEV === "true" ? "https://host.docker.internal:1046" : "https://localhost:1046";
export const MCP_SERVER_URL = "http://localhost:5678/mcp";
export const MCP_SERVER_LABEL = "Tool server";
export const MCP_SERVER_TOOL = ["tool_math_expression", "tool_ocr", "tool_automate_mouse_move", "tool_automate_mouse_click_right"];
export const MODEL_DEFAULT = "qwen3-1.7b";

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
        const text = `Time: ${localeFormat(new Date())} - ${tag}: `;

        if (typeof process !== "undefined") {
            Fs.appendFile(`${PATH_ROOT}${PATH_LOG}debug.log`, `${text}${value.toString()}\n`, () => {
                // eslint-disable-next-line no-console
                console.log(`WriteLog => ${text}`, value);
            });
        } else {
            // eslint-disable-next-line no-console
            console.log(`WriteLog => ${text}`, value);
        }
    }
};
