import { Cr } from "@cimo/request/dist/src/Main.js";

// Source
import * as HelperSrc from "./HelperSrc.js";

export const api = new Cr(`${HelperSrc.URL_ENDPOINT || ""}`);

api.setRequestInterceptor((config: RequestInit) => {
    return requestLogic(config);
});

api.setResponseInterceptor((response: Response) => {
    return responseLogic(response);
});

const requestLogic = (config: RequestInit): RequestInit => {
    return {
        ...config,
        headers: {
            ...config.headers
        },
        credentials: "include"
    };
};

const responseLogic = (response: Response) => {
    if (response.status === 403 || response.status === 500) {
        HelperSrc.writeLog("error", response.status.toString());
    }

    return response;
};
