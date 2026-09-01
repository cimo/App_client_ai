export interface IlocaleConfiguration {
    [key: string]: {
        locale: string;
        currency: string;
        dateFormat: string;
    };
}

export interface IfileDetail {
    name: string;
    baseName: string;
    size: string;
    dateModified: string;
    extension: string;
    category: string;
    mimeType: string;
}

export interface IfileDetailSignature {
    extension: string;
    category: string;
    mimeType: string;
    magicByteList?: {
        offset: number;
        bytes: number[];
    }[];
}

export interface IactionOperation {
    state: string;
    message: string | string[];
    data?: unknown;
}

export interface IapiResponse {
    response: IactionOperation;
}
