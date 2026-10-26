
import { useState } from "react";
import api from "./api";
import "./Login.css";

function ResetPassword() {
  const searchParams = new URLSearchParams(window.location.search);
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!token) {
      setError(
        "Reset link eka invalid. Aluth reset link ekak request karanna."
      );
      return;
    }

    if (newPassword.length < 8) {
      setError("Password eka at least characters 8k thiyenna oni.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords dekama saman wenna oni.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/PasswordReset/reset", {
        token,
        newPassword,
      });

      setMessage(
        response.data?.message ||
          "Password reset una. Dan aluth password eken login wenna."
      );

      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Password reset karanna bari una. Link eka expire wela athnam aluth link ekak request karanna."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>Reset Password</h2>
        <p>Oyage account ekata aluth password ekak set karanna.</p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="new-password">New Password</label>
          <input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            required
          />

          <label htmlFor="confirm-password">Confirm Password</label>
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            required
          />

          {message && <p role="status">{message}</p>}
          {error && <p role="alert">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <p>
          <a href="/">Back to Login</a>
        </p>
      </div>
    </div>
  );
}

export default ResetPassword;
