import { jsxFactory, IvirtualNode } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import * as modelIndex from "../model/Index";

const viewIndex = (variableObject: modelIndex.Ivariable, methodObject: modelIndex.Imethod): IvirtualNode => {
    return (
        <div class="full" jsmvcfw-controllerName="Index">
            <div class="page_container view_index">
                <div class="row">
                    <a href="https://github.com/cimo" target="_blank">
                        <img src="/asset/image/logo.png" class="logo cimo" />
                    </a>
                    <a href="https://www.typescriptlang.org/docs" target="_blank">
                        <img src="/asset/image/typescript.svg" class="logo typescript" />
                    </a>
                    <a href="https://tauri.app" target="_blank">
                        <img src="/asset/image/tauri.svg" class="logo tauri" />
                    </a>
                </div>
                <div class="row">
                    <button
                        onclick={() => {
                            methodObject.onClickCount();
                        }}
                    >
                        Count
                    </button>
                    <p>
                        Count: <span>{variableObject.count.state}</span>
                    </p>
                </div>
                <div class="row">
                    <input type="text" placeholder="Enter a name..." jsmvcfw-elementHookName="elementInputMessage" />
                    <button
                        onclick={() => {
                            methodObject.onClickButton();
                        }}
                    >
                        Send
                    </button>
                </div>
                <div class="row">
                    <p jsmvcfw-elementHookName="elementResultMessage"></p>
                </div>
            </div>
        </div>
    );
};

export default viewIndex;
