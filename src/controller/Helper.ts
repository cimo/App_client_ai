import * as Fs from "fs";

// Source
import * as ModelHelper from "../model/Helper";

export const DEBUG = "true";
export const PATH_LOG = "/home/root/log/";

const circularReplacer = (): ModelHelper.IcircularReplacer => {
    const weakSet = new WeakSet();

    return (key: string, value: string): string | null => {
        if (value !== null && typeof value === "object") {
            if (weakSet.has(value)) {
                return null;
            }

            weakSet.add(value);
        }

        return value;
    };
};

export const objectOutput = (obj: unknown): string => {
    return JSON.stringify(obj, circularReplacer(), 2);
};

export const writeLog = (tag: string, value: string | boolean): void => {
    if (DEBUG === "true" && PATH_LOG) {
        Fs.appendFile(`${PATH_LOG}debug.log`, `${tag}: ${value.toString()}\n`, () => {
            // eslint-disable-next-line no-console
            console.log(`WriteLog => ${tag}: `, value);
        });
    }
};

export const fileWriteStream = (filePath: string, buffer: Buffer): Promise<void> => {
    return new Promise((resolve, reject) => {
        const writeStream = Fs.createWriteStream(filePath);

        writeStream.on("open", () => {
            writeStream.write(buffer);
            writeStream.end();
        });

        writeStream.on("finish", () => {
            resolve();
        });

        writeStream.on("error", (error: Error) => {
            reject(error);
        });
    });
};

export const fileReadStream = (filePath: string): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        const chunkList: Buffer[] = [];

        const readStream = Fs.createReadStream(filePath);

        readStream.on("data", (chunk: Buffer) => {
            chunkList.push(chunk);
        });

        readStream.on("end", () => {
            const result = Buffer.concat(chunkList);

            resolve(result);
        });

        readStream.on("error", (error: Error) => {
            reject(error);
        });
    });
};

export const jsonEncode = (value: Record<string, unknown>) => {
    const jsonStringify = JSON.stringify(value);
    const encoded = Buffer.from(jsonStringify).toString("base64");
    const buffer = Buffer.from(encoded);

    return buffer;
};

export const jsonDecode = (value: Buffer) => {
    const buffer = value.toString("utf-8");
    const decoded = Buffer.from(buffer, "base64").toString("utf-8");
    const jsonParse = JSON.parse(decoded) as string;

    return jsonParse;
};
