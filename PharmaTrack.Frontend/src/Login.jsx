
import { useState } from "react";
import axios from "axios";
import "./Login.css";

function Login({ onLogin }) {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");

    if (!userName.trim() || !password) {
      setError("Please enter your username and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        "http://localhost:5275/api/User/login",
        {
          userName: userName.trim(),
          password: password,
        }
      );

      const user = response.data;

      // Save logged-in user
      localStorage.setItem(
        "pharmaTrackUser",
        JSON.stringify(user)
      );

      // Send user information to App
      onLogin(user);

    } catch (error) {
      console.error("Login failed:", error);

      if (error.response?.status === 401) {
        setError("Invalid username or password.");
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError(
          "Unable to connect to the server. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      {/* LEFT SIDE */}

      <div className="login-brand">

        <div className="brand-content">

          <div className="brand-logo">
            +
          </div>

          <h1>
            ISURI PHARMACY
          </h1>

          <p className="brand-subtitle">
            Pharmacy Management System
          </p>

          <div className="brand-line"></div>

          <p className="brand-description">
            Manage medicines, stock, sales and pharmacy
            operations efficiently and securely.
          </p>

          <div className="brand-features">

            <div>
              <span>✓</span>
              Secure Pharmacy Management
            </div>

            <div>
              <span>✓</span>
              Stock & Inventory Management
            </div>

            <div>
              <span>✓</span>
              Sales & Reports
            </div>

          </div>

        </div>

      </div>

      {/* RIGHT SIDE */}

      <div className="login-section">

        <div className="login-card">

          <div className="login-header">

            <h2>
              Welcome Back
            </h2>

            <p>
              Sign in to access your pharmacy system
            </p>

          </div>

          <form onSubmit={handleLogin}>

            {/* USERNAME */}

            <div className="login-field">

              <label>
                Username
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  👤
                </span>

                <input
                  type="text"
                  placeholder="Enter your username"
                  value={userName}
                  onChange={(e) =>
                    setUserName(e.target.value)
                  }
                  autoComplete="username"
                />

              </div>

            </div>

            {/* PASSWORD */}

            <div className="login-field">

              <label>
                Password
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  🔒
                </span>

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>

              </div>

            </div>

            {/* ERROR */}

            {error && (

              <div className="login-error">
                ⚠️ {error}
              </div>

            )}

            {/* LOGIN BUTTON */}

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? (
                "Signing in..."
              ) : (
                "Sign In"
              )}
            </button>

          </form>

          <div className="login-footer">

            <span>
              Powered by
            </span>

            <strong>
              PharmaTrack
            </strong>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Login;