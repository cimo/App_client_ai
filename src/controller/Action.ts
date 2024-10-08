// Source
import * as ControllerSetting from "./Setting";

export const saveSetting = (path: string) => {
    //const path = `${app.getAppPath()}/file/setting`;

    const element: HTMLButtonElement | null = document.querySelector(".button_save");

    if (element) {
        element.onclick = async () => {
            // eslint-disable-next-line no-console
            console.log("cimo");

            await ControllerSetting.write(path, { cimo: "test" });

            await ControllerSetting.read(path);
        };
    }
};
