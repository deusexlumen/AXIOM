import {
  FunctionDeclaration,
  Project,
  SourceFile,
  SyntaxKind,
  VariableDeclaration,
  VariableStatement,
  ts,
} from "ts-morph";

export interface ExportedFunction {
  node: FunctionDeclaration | VariableStatement;
  name: string;
  text: string;
}

export function createTsProject(): Project {
  return new Project({
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
    },
  });
}

export function findExportedFunction(sourceFile: SourceFile, name: string): ExportedFunction | undefined {
  const functionDeclaration = sourceFile
    .getFunctions()
    .find((f) => f.hasExportKeyword() && f.getName() === name);
  if (functionDeclaration !== undefined) {
    return { node: functionDeclaration, name, text: functionDeclaration.getText() };
  }

  const variableDeclaration = sourceFile.getVariableDeclaration(name);
  if (variableDeclaration === undefined) return undefined;

  const variableStatement = variableDeclaration.getVariableStatement();
  if (variableStatement === undefined || !variableStatement.hasExportKeyword()) return undefined;

  const initializer = variableDeclaration.getInitializer();
  if (initializer === undefined || initializer.getKind() !== SyntaxKind.ArrowFunction) return undefined;

  return { node: variableStatement, name, text: variableStatement.getText() };
}

export function collectReferencedNames(node: FunctionDeclaration | VariableStatement): Set<string> {
  const names = new Set<string>();
  for (const identifier of node.getDescendantsOfKind(SyntaxKind.Identifier)) {
    names.add(identifier.getText());
  }
  return names;
}

export function importsForNames(sourceFile: SourceFile, names: Set<string>): readonly string[] {
  const imports: string[] = [];
  for (const declaration of sourceFile.getImportDeclarations()) {
    const defaultImport = declaration.getDefaultImport();
    if (defaultImport !== undefined && names.has(defaultImport.getText())) {
      imports.push(declaration.getText());
      continue;
    }

    const namespaceImport = declaration.getNamespaceImport();
    if (namespaceImport !== undefined && names.has(namespaceImport.getText())) {
      imports.push(declaration.getText());
      continue;
    }

    const namedImports = declaration
      .getNamedImports()
      .filter((specifier) => names.has(specifier.getAliasNode()?.getText() ?? specifier.getName()))
      .map((specifier) => specifier.getText());
    if (namedImports.length > 0) {
      const moduleSpecifier = declaration.getModuleSpecifierValue();
      imports.push(`import { ${namedImports.join(", ")} } from "${moduleSpecifier}";`);
    }
  }
  return imports;
}
