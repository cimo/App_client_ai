export interface IfileDetail {
    fileName: string;
    baseName: string;
    mimeType: string;
    extension: string;
    category: string;
    size: string;
    dateModified: string;
}

export interface IfileDetailSignature {
    mimeType: string;
    extension: string;
    category: string;
    magicByteList?: {
        offset: number;
        bytes: number[];
    }[];
}
