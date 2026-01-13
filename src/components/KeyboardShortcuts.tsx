import React from 'react';

export default function KeyboardShortcuts({ onClose }: { onClose: () => void }) {
  return (
    <div className="overlay-panel" role="dialog" aria-modal="true" aria-labelledby="kb-shortcuts-title">
      <button className="close-btn" onClick={onClose}>Close</button>
      <h2 id="kb-shortcuts-title">Keyboard Shortcuts</h2>
      <ul>
        <li><strong>/</strong> — Focus search</li>
        <li><strong>?</strong> — Open this help</li>
        <li><strong>Esc</strong> — Close overlays (Account / Dashboard / Help)</li>
      </ul>
      <p className="calm small">These shortcuts are designed to speed up navigation. They are inactive while typing in form fields.</p>
    </div>
  );
}
