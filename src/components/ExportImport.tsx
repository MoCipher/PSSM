import { useState } from 'react';
import { PasswordEntry, exportPasswords, exportPasswordsCSV, importPasswords, importPasswordsCSV, savePasswords } from '../utils/storage';
import './ExportImport.css';

interface Props {
  passwords: PasswordEntry[];
  masterPassword: string;
  onImport: (passwords: PasswordEntry[]) => void;
}

export default function ExportImport({ passwords, masterPassword, onImport }: Props) {
  const [showMenu, setShowMenu] = useState(false);
  const [importError, setImportError] = useState('');

  const handleExportJSON = () => {
    const json = exportPasswords(passwords);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `passwords-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowMenu(false);
  };

  const handleExportCSV = () => {
    const csv = exportPasswordsCSV(passwords);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `passwords-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowMenu(false);
  };

  const handleImportJSON = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const imported = importPasswords(content);
          const merged = [...passwords, ...imported];
          savePasswords(merged, masterPassword);
          onImport(merged);
          setImportError('');
          setShowMenu(false);
          alert(`Successfully imported ${imported.length} password(s)`);
        } catch (error) {
          setImportError(error instanceof Error ? error.message : 'Failed to import');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleImportCSV = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const imported = importPasswordsCSV(content);
          const merged = [...passwords, ...imported];
          savePasswords(merged, masterPassword);
          onImport(merged);
          setImportError('');
          setShowMenu(false);
          alert(`Successfully imported ${imported.length} password(s)`);
        } catch (error) {
          setImportError(error instanceof Error ? error.message : 'Failed to import');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="export-import">
      <button onClick={() => setShowMenu(!showMenu)} className="btn btn-secondary">
        📤 Export / 📥 Import
      </button>
      
      {showMenu && (
        <div className="export-import-menu">
          <div className="menu-section">
            <h3>Export</h3>
            <button onClick={handleExportJSON} className="btn btn-small">Export as JSON</button>
            <button onClick={handleExportCSV} className="btn btn-small">Export as CSV</button>
          </div>
          
          <div className="menu-section">
            <h3>Import</h3>
            <button onClick={handleImportJSON} className="btn btn-small">Import from JSON</button>
            <button onClick={handleImportCSV} className="btn btn-small">Import from CSV</button>
          </div>
          
          {importError && <div className="error">{importError}</div>}
        </div>
      )}
    </div>
  );
}
