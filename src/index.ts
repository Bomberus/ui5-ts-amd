import { Project, ts } from "ts-morph";

export function transpileTS(
  namespace: string,
  fileName: string,
  sourceContent: string,
  tsConfig: object
): string {
  const project = new Project({
    ...tsConfig, useInMemoryFileSystem: true
  })

  const sourceFile = project.createSourceFile("Coding.ts", sourceContent, { overwrite: true });
  sourceFile.transform( traversal => {
    const node = traversal.visitChildren();

    if (ts.isClassDeclaration(node)) {
      let UI5Class =  ts.factory.updateClassDeclaration(
        node,
        [ts.factory.createDecorator(
          ts.factory.createCallExpression(
            ts.factory.createIdentifier('UI5'),
            undefined,
            [ts.factory.createStringLiteral(namespace, true)]
            )
          )
        ],
        node.modifiers,
        node.name,
        node.typeParameters,
        node.heritageClauses,
        node.members
      )
      return UI5Class;
    }

    return node;

  })  
  
  
  return ts.transpileModule(sourceContent, {
    ...tsConfig, 
    fileName,
  }).outputText
}
