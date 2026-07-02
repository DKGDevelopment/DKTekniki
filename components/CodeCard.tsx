import styles from "./CodeCard.module.css";

type Token = { text: string; type?: "keyword" | "string" | "comment" | "fn" };

const CODE: Token[][] = [
  [{ text: "// Deploy a service in a few lines", type: "comment" }],
  [
    { text: "import", type: "keyword" },
    { text: " { Tekniki } " },
    { text: "from", type: "keyword" },
    { text: " " },
    { text: '"@dktekniki/core"', type: "string" },
    { text: ";" },
  ],
  [{ text: "" }],
  [
    { text: "const", type: "keyword" },
    { text: " platform = " },
    { text: "new", type: "keyword" },
    { text: " " },
    { text: "Tekniki", type: "fn" },
    { text: "({ region: " },
    { text: '"eu-north"', type: "string" },
    { text: " });" },
  ],
  [{ text: "" }],
  [
    { text: "const", type: "keyword" },
    { text: " service = " },
    { text: "await", type: "keyword" },
    { text: " platform." },
    { text: "deploy", type: "fn" },
    { text: "({" },
  ],
  [
    { text: "  name: " },
    { text: '"api-gateway"', type: "string" },
    { text: "," },
  ],
  [
    { text: "  source: " },
    { text: '"./services/gateway"', type: "string" },
    { text: "," },
  ],
  [{ text: "  replicas: 3," }],
  [
    { text: "  healthCheck: { path: " },
    { text: '"/healthz"', type: "string" },
    { text: ", interval: 30 }," },
  ],
  [{ text: "});" }],
  [{ text: "" }],
  [
    { text: "// Every deployment is verifiable and auditable", type: "comment" },
  ],
  [
    { text: "await", type: "keyword" },
    { text: " service." },
    { text: "verify", type: "fn" },
    { text: "();" },
  ],
  [
    { text: "console." },
    { text: "log", type: "fn" },
    { text: "(service.status); " },
    { text: "// \"healthy\"", type: "comment" },
  ],
];

export default function CodeCard() {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <span>deploy.ts</span>
        <a
          href="https://github.com"
          className={styles.githubLink}
          target="_blank"
          rel="noopener noreferrer"
        >
          Github <span aria-hidden="true">↗</span>
        </a>
      </div>

      <pre className={styles.body}>
        <code>
          {CODE.map((line, i) => (
            <span key={i} className={styles.line}>
              <span className={styles.lineNumber} aria-hidden="true">
                {i + 1}
              </span>
              <span className={styles.code}>
                {line.map((token, j) => (
                  <span
                    key={j}
                    className={token.type ? styles[token.type] : undefined}
                  >
                    {token.text}
                  </span>
                ))}
                {"\n"}
              </span>
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}
