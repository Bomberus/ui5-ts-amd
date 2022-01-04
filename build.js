const { ts } = require("ts-morph");
const { readFileSync, writeFileSync, mkdirSync } = require("fs");
const { join } = require("path");
const https = require("https");

writeFileSync(
  join("lib", "ts-polyfill.js"),
  ts.transpileModule(
    readFileSync(join("polyfill", "define.ts")).toString() +
      "\n" +
      readFileSync(join("polyfill", "UI5.ts")).toString(),
    {
      compilerOptions: {
        target: ts.ScriptTarget.ES5,
      },
    }
  ).outputText
);

const getRequestJSON = (url) => {
  return new Promise((resolve, reject) => {
    const req = https.request(url, (res) => {
      let data = "";

      res.on("data", (d) => {
        data += d;
      });

      res.on("end", () => {
        resolve(JSON.parse(data));
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.end();
  });
};

getRequestJSON("https://sapui5.hana.ondemand.com/docs/api/api-index.json")
  .then((api) => {
    const readNodes = (node) => {
      if ("nodes" in node) {
        for (const child of node.nodes) {
          if (
            (child.name.indexOf("module:") == -1) && (
              child.kind === "class" ||
              child.kind === "enum"  ||
              child.kind === "namespace" && child.displayName[0] === child.displayName[0].toUpperCase() 
            )) {
            const namePath = child.name.split(".");
            const fileName = namePath.splice(-1);
            const filePath = ["types", "latest"].concat(namePath);
            mkdirSync(join(...filePath), { recursive: true });
            writeFileSync(
              join(...filePath, `${fileName}.d.ts`),
              `export default ${child.name};`
            );
          } 
          readNodes(child);
        }
      }
    };

    for (const node of api.symbols) {
      readNodes(node);
    }
  })
  .catch((e) => console.error(e));
