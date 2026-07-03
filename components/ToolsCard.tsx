import styles from "./ToolsCard.module.css";

/* Placeholder content — swap tools/wording once the team confirms the
   real design stack. */

const TOOLS = [
  {
    name: "Revit",
    use: "BIM modelling — every project lives in a coordinated 3D model, from structure to services.",
  },
  {
    name: "AutoCAD",
    use: "Technical drawings and construction documentation, down to the last detail.",
  },
  {
    name: "Rhino + Grasshopper",
    use: "Parametric design studies for facades, massing and complex geometry.",
  },
  {
    name: "3ds Max + Corona",
    use: "Photorealistic visualisation — the renders you see across our projects.",
  },
  {
    name: "SketchUp",
    use: "Fast concept massing and early design iterations with clients.",
  },
  {
    name: "Adobe Creative Suite",
    use: "Presentation, post-production and material boards.",
  },
];

export default function ToolsCard() {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <span>Design toolkit</span>
        <span>Concept → Construction</span>
      </div>

      <ul className={styles.list}>
        {TOOLS.map((tool) => (
          <li key={tool.name} className={styles.tool}>
            <span className={styles.toolName}>
              <span className={styles.toolDot} aria-hidden="true" />
              {tool.name}
            </span>
            <span className={styles.toolUse}>{tool.use}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
