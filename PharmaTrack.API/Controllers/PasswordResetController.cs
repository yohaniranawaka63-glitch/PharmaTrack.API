
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PharmaTrack.API.Data;
using PharmaTrack.API.Models;
using PharmaTrack.API.Services;

namespace PharmaTrack.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PasswordResetController : ControllerBase
    {
        private readonly PharmaTrackDbContext _context;
        private readonly EmailService _emailService;
        private readonly IConfiguration _configuration;
        private readonly PasswordHasher<User> _passwordHasher = new();

        public PasswordResetController(
            PharmaTrackDbContext context,
            EmailService emailService,
            IConfiguration configuration)
        {
            _context = context;
            _emailService = emailService;
            _configuration = configuration;
        }

        public class ForgotPasswordRequest
        {
            public string Email { get; set; } = string.Empty;
        }

        public class ResetPasswordRequest
        {
            public string Email { get; set; } = string.Empty;
            public string Token { get; set; } = string.Empty;
            public string NewPassword { get; set; } = string.Empty;
        }

        private static string HashToken(string token)
        {
            byte[] hash = SHA256.HashData(
                Encoding.UTF8.GetBytes(token));

            return Convert.ToHexString(hash);
        }

        // POST: api/PasswordReset/forgot
        [HttpPost("forgot")]
        public async Task<IActionResult> ForgotPassword(
            [FromBody] ForgotPasswordRequest request)
        {
            const string responseMessage =
                "If an active account exists for that email, a password reset link will be sent.";

            if (string.IsNullOrWhiteSpace(request.Email))
            {
                return Ok(new { message = responseMessage });
            }

            string email = request.Email.Trim().ToLowerInvariant();

            var user = await _context.Users.FirstOrDefaultAsync(u =>
                u.Email != null &&
                u.Email.ToLower() == email &&
                u.Status);

            // Do not reveal whether an account exists.
            if (user == null)
            {
                return Ok(new { message = responseMessage });
            }

            // Invalidate any earlier unused reset tokens.
            var oldTokens = await _context.PasswordResetTokens
                .Where(t => t.UserId == user.UserId && t.UsedAt == null)
                .ToListAsync();

            foreach (var oldToken in oldTokens)
            {
                oldToken.UsedAt = DateTime.UtcNow;
            }

            // Generate a cryptographically secure random token.
            string token = Convert.ToBase64String(
                    RandomNumberGenerator.GetBytes(32))
                .TrimEnd('=')
                .Replace('+', '-')
                .Replace('/', '_');

            var resetRecord = new PasswordResetToken
            {
                UserId = user.UserId,
                TokenHash = HashToken(token),
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddMinutes(30),
                UsedAt = null
            };

            _context.PasswordResetTokens.Add(resetRecord);
            await _context.SaveChangesAsync();

            string frontendUrl =
                _configuration["FrontendUrl"]?.TrimEnd('/')
                ?? "http://localhost:5173";

            string resetLink =
                $"{frontendUrl}/reset-password?email=" +
                Uri.EscapeDataString(user.Email!) +
                $"&token={Uri.EscapeDataString(token)}";

            try
            {
                await _emailService.SendEmailAsync(
                    user.Email!,
                    "PharmaTrack Password Reset",
                    "A password reset was requested for your PharmaTrack account.\n\n" +
                    "Open this link to set a new password (valid for 30 minutes):\n\n" +
                    resetLink +
                    "\n\nIf you did not request this, you can ignore this email."
                );
            }
            catch (Exception ex)
            {
                // Do not log the token or reset link.
                Console.Error.WriteLine(
                    $"Password reset email delivery failed: {ex.Message}");

                resetRecord.UsedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }

            return Ok(new { message = responseMessage });
        }

        // POST: api/PasswordReset/reset
        [HttpPost("reset")]
        public async Task<IActionResult> ResetPassword(
            [FromBody] ResetPasswordRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email) ||
                string.IsNullOrWhiteSpace(request.Token) ||
                string.IsNullOrWhiteSpace(request.NewPassword) ||
                request.NewPassword.Length < 6)
            {
                return BadRequest(new
                {
                    message = "The reset link or new password is invalid."
                });
            }

            string email = request.Email.Trim().ToLowerInvariant();
            string tokenHash = HashToken(request.Token);

            var resetRecord = await _context.PasswordResetTokens
                .Include(t => t.User)
                .FirstOrDefaultAsync(t =>
                    t.TokenHash == tokenHash &&
                    t.User.Email != null &&
                    t.User.Email.ToLower() == email &&
                    t.UsedAt == null);

            if (resetRecord == null ||
                resetRecord.ExpiresAt <= DateTime.UtcNow ||
                !resetRecord.User.Status)
            {
                return BadRequest(new
                {
                    message = "The reset link is invalid or expired. Please request a new one."
                });
            }

            var user = resetRecord.User;

            user.Password = _passwordHasher.HashPassword(
                user,
                request.NewPassword);

            resetRecord.UsedAt = DateTime.UtcNow;

            // Invalidate any other outstanding reset tokens for this user.
            var otherTokens = await _context.PasswordResetTokens
                .Where(t => t.UserId == user.UserId &&
                            t.PasswordResetTokenId !=
                            resetRecord.PasswordResetTokenId &&
                            t.UsedAt == null)
                .ToListAsync();

            foreach (var otherToken in otherTokens)
            {
                otherToken.UsedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Password reset successfully. You can now sign in with your new password."
            });
        }
    }
}
