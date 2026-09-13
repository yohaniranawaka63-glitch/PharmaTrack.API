using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PharmaTrack.API.Data;
using PharmaTrack.API.Models;

namespace PharmaTrack.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly PharmaTrackDbContext _context;
        private readonly PasswordHasher<User> _passwordHasher;

        public UserController(PharmaTrackDbContext context)
        {
            _context = context;
            _passwordHasher = new PasswordHasher<User>();
        }

        [HttpGet]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _context.Users
                .Select(u => new
                {
                    u.UserId,
                    u.Name,
                    u.UserName,
                    u.RoleId,
                    u.Status
                })
                .ToListAsync();

            return Ok(users);
        }

        [HttpPost]
        public async Task<IActionResult> CreateUser([FromBody] User user)
        {
            user.Password = _passwordHasher.HashPassword(
                user,
                user.Password
            );

            _context.Users.Add(user);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "User created successfully.",
                userId = user.UserId,
                name = user.Name,
                userName = user.UserName,
                roleId = user.RoleId,
                status = user.Status
            });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.UserName == request.UserName);

            if (user == null)
            {
                return Unauthorized(new
                {
                    message = "Invalid username or password."
                });
            }

            if (!user.Status)
            {
                return Unauthorized(new
                {
                    message = "User account is inactive."
                });
            }

            var result = _passwordHasher.VerifyHashedPassword(
                user,
                user.Password,
                request.Password
            );

            if (result == PasswordVerificationResult.Failed)
            {
                return Unauthorized(new
                {
                    message = "Invalid username or password."
                });
            }

            return Ok(new
            {
                message = "Login successful.",
                userId = user.UserId,
                name = user.Name,
                userName = user.UserName,
                roleId = user.RoleId
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(
            int id,
            [FromBody] User updatedUser)
        {
            var user = await _context.Users.FindAsync(id);

            if (user == null)
            {
                return NotFound(new
                {
                    message = "User not found."
                });
            }

            user.Name = updatedUser.Name;
            user.UserName = updatedUser.UserName;
            user.RoleId = updatedUser.RoleId;
            user.Status = updatedUser.Status;

            if (!string.IsNullOrWhiteSpace(updatedUser.Password))
            {
                user.Password = _passwordHasher.HashPassword(
                    user,
                    updatedUser.Password
                );
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "User updated successfully.",
                userId = user.UserId,
                name = user.Name,
                userName = user.UserName,
                roleId = user.RoleId,
                status = user.Status
            });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.Users.FindAsync(id);

            if (user == null)
            {
                return NotFound(new
                {
                    message = "User not found."
                });
            }

            _context.Users.Remove(user);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "User deleted successfully.",
                userId = id
            });
        }
    }

    public class LoginRequest
    {
        public string UserName { get; set; } = string.Empty;

        public string Password { get; set; } = string.Empty;
    }
}