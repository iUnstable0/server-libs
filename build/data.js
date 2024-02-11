"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
if (!fs_1.default.existsSync("data")) {
    fs_1.default.mkdirSync("data");
}
class lib_data {
    static async readFile(path) {
        let fileContent = fs_1.default.readFileSync(`data/${path}`, "utf8");
        try {
            fileContent = await JSON.parse(fileContent);
        }
        catch (error) { }
        return fileContent;
    }
    static writeFile(path, content) {
        if (typeof content !== "string" && typeof content !== "number") {
            content = JSON.stringify(content);
        }
        fs_1.default.writeFileSync(`data/${path}`, content);
    }
    static exists(path) {
        return fs_1.default.existsSync(`data/${path}`);
    }
}
exports.default = lib_data;
