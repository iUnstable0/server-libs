import fs from "fs";

if (!fs.existsSync("data")) {
  fs.mkdirSync("data");
}

export default class lib_data {
  public static async readFile(path: string) {
    let fileContent = fs.readFileSync(`data/${path}`, "utf8");

    try {
      fileContent = await JSON.parse(fileContent);
    } catch (error) {}

    return fileContent;
  }

  public static writeFile(path: string, content: any) {
    if (typeof content !== "string" && typeof content !== "number") {
      content = JSON.stringify(content);
    }

    fs.writeFileSync(`data/${path}`, content);
  }

  public static exists(path: string) {
    return fs.existsSync(`data/${path}`);
  }
}
