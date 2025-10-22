import React, { useState, useRef } from 'react';
import { BlocklyWorkspace } from '@kuband/react-blockly';
// Import the JS generator from Blockly
import { javascriptGenerator } from 'blockly/javascript';
import * as Blockly from "blockly";

const TOOLBOX = {
  "kind": "flyoutToolbox",
  "contents": [
    {
      "kind": "block",
      "type": "controls_if"
    },
    {
      "kind": "block",
      "type": "controls_repeat_ext"
    },
    {
      "kind": "block",
      "type": "logic_compare"
    },
    {
      "kind": "block",
      "type": "math_number"
    },
    {
      "kind": "block",
      "type": "math_arithmetic"
    },
    {
      "kind": "block",
      "type": "text"
    },
    {
      "kind": "block",
      "type": "text_print"
    }
  ]
};

export const BlocklyEditor: React.FC = () => {
  const [workspaceXml, setWorkspaceXml] = useState<string>('');
  const workspaceRef = useRef<Blockly.Workspace | null>(null);



  const runCode = () => {
    const workspace = workspaceRef.current;
    if (!workspace) {
      console.warn('No workspace available');
      return;
    }
    try {
      // generate JS code
      const code = javascriptGenerator.workspaceToCode(workspace);
      console.log('Generated code:', code);
      // optionally evaluate it
      // WARNING: eval has risks — for prototyping only
      // eslint-disable-next-line no-eval
      eval(code);
    } catch (e) {
      console.error('Error running code:', e);
      alert(`Error running code: ${e}`);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ flex: 1 }}>
        <BlocklyWorkspace
          ref={(workspace: Blockly.Workspace | null) => { workspaceRef.current = workspace; }}
          className="blocklyDiv"
          toolboxConfiguration={TOOLBOX}
          initialXml={workspaceXml}
          onXmlChange={setWorkspaceXml}
          workspaceConfiguration={{
            comments: true,
            scrollbars: true,
            trashcan: true
          }}
        />
      </div>
      <div style={{ width: '300px', padding: '10px', borderLeft: '1px solid #ccc' }}>
        <button onClick={runCode}>Run Code</button>
        <hr/>
        <h4>Generated XML</h4>
        <textarea
          style={{ width: '100%', height: '200px' }}
          readOnly
          value={workspaceXml}
        />
      </div>
    </div>
  );
};
