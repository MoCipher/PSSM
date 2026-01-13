import { useState } from 'react';
import './PasswordForm.css';

interface Props {
  visible: boolean;
  onClose: () => void;
  onGenerate: (password: string) => void;
}

const DEFAULT_LENGTH = 16;

const secureRandom = (n: number) => {
  const arr = new Uint8Array(n);
  window.crypto.getRandomValues(arr);
  return arr;
};

const genPassword = (length: number, opts: { upper: boolean; lower: boolean; numbers: boolean; symbols: boolean }) => {
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()-_=+[]{};:,.<>?';

  let charset = '';
  if (opts.lower) charset += lower;
  if (opts.upper) charset += upper;
  if (opts.numbers) charset += numbers;
  if (opts.symbols) charset += symbols;

  if (!charset) charset = lower + upper + numbers;

  const bytes = secureRandom(length);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += charset[bytes[i] % charset.length];
  }
  return out;
};

export default function PasswordGenerator({ visible, onClose, onGenerate }: Props) {
  const [length, setLength] = useState(DEFAULT_LENGTH);
  const [opts, setOpts] = useState({ upper: true, lower: true, numbers: true, symbols: false });
  const [preview, setPreview] = useState('');

  if (!visible) return null;

  const regenerate = () => {
    const p = genPassword(length, opts);
    setPreview(p);
  };

  return (
    <div className="pg-overlay">
      <div className="pg-panel">
        <h3>Password Generator</h3>
        <div className="form-row">
          <label>Length: {length}</label>
          <input type="range" min={8} max={64} value={length} onChange={(e) => setLength(Number(e.target.value))} />
        </div>

        <div className="form-row">
          <label>
            <input type="checkbox" checked={opts.upper} onChange={(e) => setOpts(o => ({ ...o, upper: e.target.checked }))} />
            Include uppercase
          </label>
        </div>
        <div className="form-row">
          <label>
            <input type="checkbox" checked={opts.lower} onChange={(e) => setOpts(o => ({ ...o, lower: e.target.checked }))} />
            Include lowercase
          </label>
        </div>
        <div className="form-row">
          <label>
            <input type="checkbox" checked={opts.numbers} onChange={(e) => setOpts(o => ({ ...o, numbers: e.target.checked }))} />
            Include numbers
          </label>
        </div>
        <div className="form-row">
          <label>
            <input type="checkbox" checked={opts.symbols} onChange={(e) => setOpts(o => ({ ...o, symbols: e.target.checked }))} />
            Include symbols
          </label>
        </div>

        <div style={{ marginTop: 12 }}>
          <div className="preview">{preview || '—'}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={regenerate}>Regenerate</button>
            <button type="button" className="btn btn-primary" onClick={() => { const p = genPassword(length, opts); onGenerate(p); onClose(); }}>Use Password</button>
            <button type="button" className="btn" onClick={() => { setPreview(''); onClose(); }}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
