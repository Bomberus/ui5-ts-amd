import * as ts from "typescript";
import { readFileSync } from "fs";
import { join } from "path";

export function transpileTS(
  namespace: string,
  fileName: string,
  sourceContent: string,
  tsConfig: object
): string {
  const UI5TransformerFactory: ts.TransformerFactory<ts.SourceFile> = (
    context
  ) => {
    let importList: { [key: string]: boolean } = {};

    function addDecorator(node: ts.ClassDeclaration) {
      let newDecorators = context.factory.createNodeArray([
        context.factory.createDecorator(
          context.factory.createCallExpression(
            context.factory.createIdentifier("UI5"),
            undefined,
            context.factory.createNodeArray([
              context.factory.createStringLiteral(namespace, false),
            ])
          )
        ),
      ]);

      if (node.decorators) {
        newDecorators = context.factory.createNodeArray(
          node.decorators.concat(newDecorators)
        );
      }

      return newDecorators;
    }

    function transformUI5Class(node: ts.ClassDeclaration) {
      const heritageClasses = node.heritageClauses?.reduce(
        (acc: string[], curr) => {
          return acc.concat(
            curr.types.map((t) => (t.expression as ts.StringLiteral).text)
          );
        },
        []
      );

      if (
        heritageClasses?.reduce((acc, curr) => acc || importList[curr], false)
      ) {
        let UI5Class = context.factory.updateClassDeclaration(
          node,
          addDecorator(node),
          node.modifiers,
          node.name,
          node.typeParameters,
          node.heritageClauses || [],
          node.members
        );
        return ts.setTextRange(UI5Class, node);
      } else {
        return node;
      }
    }

    function analyzeImport(node: ts.ImportDeclaration) {
      if (node.importClause && node.importClause.name) {
        importList[
          node.importClause.name.text
        ] = (node.moduleSpecifier as ts.StringLiteral).text.startsWith("sap/");
      }
    }

    return (sourceFile) => {
      const visitor = (node: ts.Node): ts.Node => {
        if (node.kind === ts.SyntaxKind.ClassDeclaration) {
          return ts.visitEachChild(
            transformUI5Class(<ts.ClassDeclaration>node),
            visitor,
            context
          );
        } else if (node.kind === ts.SyntaxKind.ImportDeclaration) {
          analyzeImport(<ts.ImportDeclaration>node);
        }
        return ts.visitEachChild(node, visitor, context);
      };
      return ts.visitNode(sourceFile, visitor);
    };
  };

  return ts.transpileModule(sourceContent, {
    ...tsConfig, 
    fileName,
    transformers: {before: [UI5TransformerFactory]}
  }).outputText
}
