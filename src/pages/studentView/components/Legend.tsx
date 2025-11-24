interface Props { cellTypes: Record<string, { label: string; color: string }>; }
export default function Legend({ cellTypes }: Props){
  return (
    <div className="legend">
      <strong>Legend:</strong>
      <ul>
        {Object.entries(cellTypes).map(([key, { label, color }]) => (
          <li key={key}>
            <span className="swatch" style={{ background: color }}></span>
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}
