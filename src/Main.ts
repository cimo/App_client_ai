import { setUrlRoot, setAppLabel, route } from "@cimo/jsmvcfw/dist/src/Main.js";

// Source
import ControllerIndex from "./controller/Index";

setUrlRoot("");
setAppLabel("jsmvcfw");

route([
    {
        title: "Index",
        path: "/",
        controller: () => new ControllerIndex()
    }
]);
