type CellTypeDef<K extends string> = Record<K, { label: string; color: string }> | { [k: string]: { label: string; color: string } };

interface Props<K extends string> {
  mode: K;
  setMode: (m: K) => void;
  cellTypes: CellTypeDef<K>;
}

export default function ModePicker<K extends string>({ mode, setMode, cellTypes }: Props<K>) {
  return (
    <div className="mode-picker">
      <strong>Mode:</strong>
      {Object.entries(cellTypes).map(([key, { label, color }]) => (
        <label key={key} className="mode-label">
          <input 
            type="radio" 
            name="mode" 
            value={key}
            defaultChecked={mode === (key as K)}
            onChange={(e) => {
              if (e.target.checked) {
                setMode(key as K);
              }
            }} 
          />
          <span className="mode-swatch" style={{ background: color }}></span>
          {label}
        </label>
      ))}
    </div>
  );
}
