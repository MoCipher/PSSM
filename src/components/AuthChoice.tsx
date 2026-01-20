import './AuthChoice.css';

interface Props {
  onChooseLogin: () => void;
}

export default function AuthChoice({ onChooseLogin }: Props) {
  return (
    <div className="auth-choice">
      <div className="choice-card">
        <h1>🔐 Password Manager</h1>
        <p>Personal password manager for authorized users only</p>

        <div className="choice-buttons">
          <button onClick={onChooseLogin} className="btn btn-primary">
            Sign In
          </button>
        </div>

        <div className="authorized-users">
          <p><strong>Authorized Users:</strong></p>
          <ul>
            <li>spoass@icloud.com</li>
            <li>laila.torresanz@hotmail.com</li>
          </ul>
        </div>

        <div className="features">
          <div className="feature">
            <span className="feature-icon">🔒</span>
            <span>End-to-end encryption</span>
          </div>
          <div className="feature">
            <span className="feature-icon">📱</span>
            <span>Sync across devices</span>
          </div>
          <div className="feature">
            <span className="feature-icon">👥</span>
            <span>Personal access only</span>
          </div>
        </div>
      </div>
    </div>
  );
}