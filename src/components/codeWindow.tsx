import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function CodeWindow({ code }: { code: string }) {
  return (
    <div className="output">
      <SyntaxHighlighter
        language="javascript"
        style={oneDark}
        customStyle={{
          borderRadius: 0,
          padding: 0,          // no padding
          height: "100%",
          overflowY: "auto",
          margin: 0            // flush with container
        }}
        showLineNumbers
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
