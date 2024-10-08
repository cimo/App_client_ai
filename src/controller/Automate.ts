import { screen, mouse, straightTo, randomPointIn, Region } from "@nut-tree/nut-js";

// Source
import * as ModelAutomate from "../model/Automate";

let mouseMoveInterval: NodeJS.Timer | undefined;
let isMouseMove = false;

const mouseMove = (isStart: boolean) => {
    if (isStart && mouseMoveInterval === undefined) {
        mouseMoveInterval = setInterval(() => {
            if (!isMouseMove) {
                isMouseMove = true;

                void (async () => {
                    const screenWidth = await screen.width();
                    const screenHeight = await screen.height();

                    const targetRegion = new Region(0, 0, screenWidth, screenHeight);

                    await mouse.move(straightTo(randomPointIn(targetRegion))).then(() => {
                        isMouseMove = false;
                    });
                })();
            }
        }, 4 * 60 * 1000);
    } else if (!isStart && mouseMoveInterval !== undefined) {
        clearInterval(mouseMoveInterval);
        mouseMoveInterval = undefined;
    }
};

export const keyAction = (globalShortcut: Electron.GlobalShortcut, notification: typeof Electron.Notification) => {
    globalShortcut.register(ModelAutomate.KEY_START, () => {
        new notification({
            title: ModelAutomate.NOTIFICATION_START_TITLE,
            body: ModelAutomate.NOTIFICATION_START_BODY
        }).show();

        mouseMove(true);
    });

    globalShortcut.register(ModelAutomate.KEY_END, () => {
        new notification({
            title: ModelAutomate.NOTIFICATION_END_TITLE,
            body: ModelAutomate.NOTIFICATION_END_BODY
        }).show();

        mouseMove(false);
    });
};
