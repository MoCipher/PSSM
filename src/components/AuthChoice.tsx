import './AuthChoice.css';

interface Props {
  onChooseLogin: () => void;
  onChooseRegister: () => void;
}

export default function AuthChoice({ onChooseLogin, onChooseRegister }: Props) {
  return (
    <div className="auth-choice">
      <div className="choice-card">
        <h1>🔐 Password Manager</h1>
        <p>Securely store and sync your passwords across all your devices using email verification</p>

        <div className="choice-buttons">
          <button onClick={onChooseLogin} className="btn btn-primary">
            Sign In
          </button>
          <button onClick={onChooseRegister} className="btn btn-secondary">
            Create Account
          </button>
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
            <span className="feature-icon">🚀</span>
            <span>Fast and secure</span>
          </div>
        </div>
      </div>
    </div>
  );
}