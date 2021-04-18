"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transpileTS = void 0;
const ts = require("typescript");
function transpileTS(namespace, fileName, sourceContent, tsConfig) {
    const UI5TransformerFactory = (context) => {
        let importList = {};
        function addDecorator(node) {
            let newDecorators = context.factory.createNodeArray([
                context.factory.createDecorator(context.factory.createCallExpression(context.factory.createIdentifier("UI5"), undefined, context.factory.createNodeArray([
                    context.factory.createStringLiteral(namespace, false),
                ]))),
            ]);
            if (node.decorators) {
                newDecorators = context.factory.createNodeArray(node.decorators.concat(newDecorators));
            }
            return newDecorators;
        }
        function transformUI5Class(node) {
            var _a;
            const heritageClasses = (_a = node.heritageClauses) === null || _a === void 0 ? void 0 : _a.reduce((acc, curr) => {
                return acc.concat(curr.types.map((t) => t.expression.text));
            }, []);
            if (heritageClasses === null || heritageClasses === void 0 ? void 0 : heritageClasses.reduce((acc, curr) => acc || importList[curr], false)) {
                let UI5Class = context.factory.updateClassDeclaration(node, addDecorator(node), node.modifiers, node.name, node.typeParameters, node.heritageClauses || [], node.members);
                return ts.setTextRange(UI5Class, node);
            }
            else {
                return node;
            }
        }
        function analyzeImport(node) {
            if (node.importClause && node.importClause.name) {
                importList[node.importClause.name.text] = node.moduleSpecifier.text.startsWith("sap/");
            }
        }
        return (sourceFile) => {
            const visitor = (node) => {
                if (node.kind === ts.SyntaxKind.ClassDeclaration) {
                    return ts.visitEachChild(transformUI5Class(node), visitor, context);
                }
                else if (node.kind === ts.SyntaxKind.ImportDeclaration) {
                    analyzeImport(node);
                }
                return ts.visitEachChild(node, visitor, context);
            };
            return ts.visitNode(sourceFile, visitor);
        };
    };
    return ts.transpileModule(sourceContent, Object.assign(Object.assign({}, tsConfig), { fileName, transformers: { before: [UI5TransformerFactory] } })).outputText;
}
exports.transpileTS = transpileTS;
