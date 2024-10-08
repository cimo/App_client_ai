// Source
import * as ControllerHelper from "./Helper";

export const write = async (path: string, value: Record<string, unknown>) => {
    const encoded = ControllerHelper.jsonEncode(value);

    await ControllerHelper.fileWriteStream(path, encoded);
};

export const read = async (path: string) => {
    const fileReadStream = await ControllerHelper.fileReadStream(path);

    return ControllerHelper.jsonDecode(fileReadStream);
};
