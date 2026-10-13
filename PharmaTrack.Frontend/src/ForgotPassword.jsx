import { useState } from "react";
import api from "./api";
import "./Login.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/PasswordReset/forgot", {
        email: email.trim(),
      });

      setMessage(
        response.data?.message ||
          "If an active account exists for that email, a password reset link will be sent."
      );
    } catch {
      setError(
        "Request eka yawanna bari una. Internet connection eka saha API server eka check karanna."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>Forgot Password?</h2>

        <p>
          Oyage account ekata sambandha email address eka enter karanna.
          Reset link ekak email eken labunoth eya open karanna.
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="reset-email">Email Address</label>

          <input
            id="reset-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            required
          />

          {message && <p role="status">{message}</p>}
          {error && <p role="alert">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <p>
          <a href="/">Back to Login</a>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;