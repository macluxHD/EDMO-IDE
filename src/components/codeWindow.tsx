import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

export default function CodeWindow({ code }: { code: string | string[] }) {
  // Multiple code blocks
  if (Array.isArray(code)) {
    return (
      <div className="output" style={{ overflowY: "auto", height: "100%" }}>
        {code.map((codeBlock, index) => (
          <div
            key={index}
            style={{ marginBottom: code.length > 1 ? "20px" : "0" }}
          >
            {code.length > 1 && (
              <div
                style={{
                  backgroundColor: "#282c34",
                  color: "#61dafb",
                  padding: "8px 12px",
                  fontFamily: "monospace",
                  fontSize: "14px",
                  borderBottom: "1px solid #3e4451",
                }}
              >
                // Thread {index + 1} (runs in parallel)
              </div>
            )}
            <SyntaxHighlighter
              language="javascript"
              style={oneDark}
              customStyle={{
                borderRadius: 0,
                padding: code.length > 1 ? "12px" : 0,
                margin: 0,
                overflowY: "visible",
              }}
              showLineNumbers
            >
              {codeBlock}
            </SyntaxHighlighter>
          </div>
        ))}
      </div>
    );
  }

  // Single code block
  return (
    <div className="output">
      <SyntaxHighlighter
        language="javascript"
        style={oneDark}
        customStyle={{
          borderRadius: 0,
          padding: 0,
          height: "100%",
          overflowY: "auto",
          margin: 0,
        }}
        showLineNumbers
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
