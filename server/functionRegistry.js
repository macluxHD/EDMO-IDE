const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const sourceRoot = path.resolve(__dirname, '..', 'src');
const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });

const functionDescriptors = [
  {
    name: 'setServoRotation',
    signature: 'setServoRotation(servoId: number | string, angle: number)',
    description: 'Routes Blockly commands into the EDMO arm simulation by forwarding angles to the proper servo.',
    exportName: 'setServoRotation',
    source: 'custom_blocks/setRotation.ts',
    blockXml: `<block type="set_rotation">
  <value name="SERVO_ID">
    <shadow type="math_number">
      <field name="NUM">0</field>
    </shadow>
  </value>
  <value name="ANGLE">
    <shadow type="math_number">
      <field name="NUM">90</field>
    </shadow>
  </value>
</block>`
  },
  {
    name: 'sleep',
    signature: 'sleep(signal: AbortSignal): (seconds: number) => Promise<void>',
    description: 'Creates an abort-aware delay helper that Blockly programs use to pause execution.',
    exportName: 'sleep',
    source: 'custom_blocks/sleep.ts',
    blockXml: `<block type="sleep">
  <value name="SECONDS">
    <shadow type="math_number">
      <field name="NUM">1</field>
    </shadow>
  </value>
</block>`
  }
];

function resolveSourcePath(relativePath) {
  return path.join(sourceRoot, relativePath);
}

function findExportedNode(sourceFile, exportName) {
  let match = null;

  function visit(node) {
    if (match) return;
    if (ts.isFunctionDeclaration(node) && node.name && node.name.text === exportName) {
      match = node;
      return;
    }

    if (ts.isVariableStatement(node)) {
      for (const decl of node.declarationList.declarations) {
        if (ts.isIdentifier(decl.name) && decl.name.text === exportName) {
          match = node;
          return;
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return match;
}

function extractFunctionCode(descriptor) {
  const absPath = resolveSourcePath(descriptor.source);
  const fileText = fs.readFileSync(absPath, 'utf8');
  const sourceFile = ts.createSourceFile(absPath, fileText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const node = findExportedNode(sourceFile, descriptor.exportName);

  if (!node) {
    throw new Error(`Function ${descriptor.exportName} not found in ${descriptor.source}`);
  }

  return printer.printNode(ts.EmitHint.Unspecified, node, sourceFile).trim();
}

function listFunctionSummaries() {
  return functionDescriptors.map(({ name, signature, description }) => ({
    name,
    signature,
    description
  }));
}

function getFunctionDetail(name) {
  const descriptor = functionDescriptors.find((fn) => fn.name === name);
  if (!descriptor) return null;

  const codeTemplate = extractFunctionCode(descriptor);

  return {
    name: descriptor.name,
    signature: descriptor.signature,
    description: descriptor.description,
    blockXml: descriptor.blockXml,
    codeTemplate
  };
}

module.exports = {
  listFunctionSummaries,
  getFunctionDetail
};
