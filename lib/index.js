"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transpileTS = void 0;
const ts_morph_1 = require("ts-morph");
function transpileTS(namespace, fileName, sourceContent, tsConfig) {
    const project = new ts_morph_1.Project(Object.assign(Object.assign({}, tsConfig), { useInMemoryFileSystem: true }));
    const sourceFile = project.createSourceFile("Coding.ts", sourceContent, { overwrite: true });
    sourceFile.transform(traversal => {
        const node = traversal.visitChildren();
        if (ts_morph_1.ts.isClassDeclaration(node)) {
            let UI5Class = ts_morph_1.ts.factory.updateClassDeclaration(node, [ts_morph_1.ts.factory.createDecorator(ts_morph_1.ts.factory.createCallExpression(ts_morph_1.ts.factory.createIdentifier('UI5'), undefined, [ts_morph_1.ts.factory.createStringLiteral(namespace, true)]))
            ], node.modifiers, node.name, node.typeParameters, node.heritageClauses, node.members);
            return UI5Class;
        }
        return node;
    });
    return ts_morph_1.ts.transpileModule(sourceContent, Object.assign(Object.assign({}, tsConfig), { fileName })).outputText;
}
exports.transpileTS = transpileTS;
