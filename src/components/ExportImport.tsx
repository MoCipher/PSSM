import { useState } from 'react';
import { PasswordEntry, exportPasswords, exportPasswordsCSV, importPasswords, importPasswordsCSV } from '../utils/storage';
import { syncPasswords } from '../utils/cloudStorage';
import { autoDetectAndParse } from '../utils/passwordImport';
import { Download, Upload, MoreVertical } from 'lucide-react';
import './ExportImport.css';

interface Props {
  passwords: PasswordEntry[];
  masterPassword: string;
  onImport: (passwords: PasswordEntry[]) => void;
}

export default function ExportImport({ passwords, masterPassword: _masterPassword, onImport }: Props) {
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

  const handleImportFromPasswordManager = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.csv';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string;
          const imported = autoDetectAndParse(content, file.name);
          const merged = [...passwords, ...imported];
          await syncPasswords(merged);
          onImport(merged);
          setImportError('');
          setShowMenu(false);
          alert(`Successfully imported ${imported.length} password(s) from ${file.name}`);
        } catch (error) {
          setImportError(error instanceof Error ? error.message : 'Failed to import');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleImportJSON = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string;
          const imported = importPasswords(content);
          const merged = [...passwords, ...imported];
          await syncPasswords(merged);
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
      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string;
          const imported = importPasswordsCSV(content);
          const merged = [...passwords, ...imported];
          await syncPasswords(merged);
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
      <button onClick={() => setShowMenu(!showMenu)} className="btn btn-secondary icon-btn" title="Import/Export passwords">
        <MoreVertical size={20} />
        <span>Import/Export</span>
      </button>
      
      {showMenu && (
        <div className="export-import-menu">
          <div className="menu-section">
            <h3>Export Passwords</h3>
            <button onClick={handleExportJSON} className="btn btn-small menu-btn">
              <Download size={16} />
              <span>Export as JSON</span>
            </button>
            <button onClick={handleExportCSV} className="btn btn-small menu-btn">
              <Download size={16} />
              <span>Export as CSV</span>
            </button>
          </div>
          
          <div className="divider"></div>
          
          <div className="menu-section">
            <h3>Import from Password Manager</h3>
            <button onClick={handleImportFromPasswordManager} className="btn btn-small menu-btn highlight">
              <Upload size={16} />
              <span>Bitwarden, 1Password, LastPass, Apple, Google</span>
            </button>
          </div>
          
          <div className="menu-section">
            <h3>Import Custom Format</h3>
            <button onClick={handleImportJSON} className="btn btn-small menu-btn">
              <Upload size={16} />
              <span>Import JSON</span>
            </button>
            <button onClick={handleImportCSV} className="btn btn-small menu-btn">
              <Upload size={16} />
              <span>Import CSV</span>
            </button>
          </div>
          
          {importError && <div className="error">{importError}</div>}
        </div>
      )}
    </div>
  );
}
