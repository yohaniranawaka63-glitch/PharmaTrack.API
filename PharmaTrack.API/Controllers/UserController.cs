
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
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

        // GET ALL USERS
        [HttpGet]
        public async Task<IActionResult> GetUsers()
        {
            try
            {
                var users = await _context.Users
                    .AsNoTracking()
                    .Select(u => new
                    {
                        u.UserId,
                        u.Name,
                        u.UserName,
                        u.Email,
                        u.RoleId,
                        u.Status
                    })
                    .ToListAsync();

                return Ok(users);
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine(ex);

                return StatusCode(500, new
                {
                    message = "Failed to load users."
                });
            }
        }

        // CREATE USER
        [HttpPost]
        public async Task<IActionResult> CreateUser([FromBody] User user)
        {
            try
            {
                if (user == null)
                {
                    return BadRequest(new { message = "Invalid user details." });
                }

                user.Name = user.Name?.Trim() ?? string.Empty;
                user.UserName = user.UserName?.Trim() ?? string.Empty;
                user.Email = user.Email?.Trim().ToLowerInvariant();

                if (string.IsNullOrWhiteSpace(user.Name))
                    return BadRequest(new { message = "Name is required." });

                if (string.IsNullOrWhiteSpace(user.UserName))
                    return BadRequest(new { message = "Username is required." });

                if (string.IsNullOrWhiteSpace(user.Email))
                    return BadRequest(new { message = "Email address is required." });

                if (!new EmailAddressAttribute().IsValid(user.Email))
                    return BadRequest(new { message = "Please enter a valid email address." });

                if (string.IsNullOrWhiteSpace(user.Password))
                    return BadRequest(new { message = "Password is required." });

                if (user.Password.Length < 6)
                    return BadRequest(new { message = "Password must be at least 6 characters." });

                if (user.RoleId <= 0)
                    return BadRequest(new { message = "Please select a valid role." });

                bool validRole = await _context.Roles
                    .AnyAsync(r => r.RoleId == user.RoleId);

                if (!validRole)
                    return BadRequest(new { message = "The selected role does not exist." });

                bool duplicateUser = await _context.Users
                    .AnyAsync(u => u.UserName == user.UserName);

                if (duplicateUser)
                    return BadRequest(new { message = "Username already exists." });

                bool duplicateEmail = await _context.Users
                    .AnyAsync(u => u.Email != null &&
                                   u.Email.ToLower() == user.Email);

                if (duplicateEmail)
                    return BadRequest(new { message = "Email address is already registered." });

                // Hash password before saving
                user.Password = _passwordHasher.HashPassword(user, user.Password);

                // Ensure Email is assigned before database save
                var emailToSave = user.Email;

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "User created successfully.",
                    userId = user.UserId,
                    name = user.Name,
                    userName = user.UserName,
                    email = emailToSave,
                    roleId = user.RoleId,
                    status = user.Status
                });
            }
            catch (DbUpdateException ex)
            {
                Console.Error.WriteLine(ex);

                return BadRequest(new
                {
                    message = "Could not save the user. Check the username, email and selected role."
                });
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine(ex);

                return StatusCode(500, new
                {
                    message = "Failed to create user."
                });
            }
        }

        // LOGIN
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            try
            {
                if (request == null ||
                    string.IsNullOrWhiteSpace(request.UserName) ||
                    string.IsNullOrWhiteSpace(request.Password))
                {
                    return BadRequest(new
                    {
                        message = "Username and password are required."
                    });
                }

                string userName = request.UserName.Trim();

                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.UserName == userName);

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

                if (result == PasswordVerificationResult.SuccessRehashNeeded)
                {
                    user.Password = _passwordHasher.HashPassword(
                        user,
                        request.Password
                    );

                    await _context.SaveChangesAsync();
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
            catch (Exception ex)
            {
                Console.Error.WriteLine(ex);

                return StatusCode(500, new
                {
                    message = "Login failed."
                });
            }
        }

        // UPDATE USER
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(
            int id,
            [FromBody] User updatedUser)
        {
            try
            {
                if (updatedUser == null)
                {
                    return BadRequest(new { message = "Invalid user details." });
                }

                var user = await _context.Users.FindAsync(id);

                if (user == null)
                {
                    return NotFound(new { message = "User not found." });
                }

                updatedUser.Name = updatedUser.Name?.Trim() ?? string.Empty;
                updatedUser.UserName = updatedUser.UserName?.Trim() ?? string.Empty;
                updatedUser.Email = updatedUser.Email?.Trim().ToLowerInvariant();

                if (string.IsNullOrWhiteSpace(updatedUser.Name))
                    return BadRequest(new { message = "Name is required." });

                if (string.IsNullOrWhiteSpace(updatedUser.UserName))
                    return BadRequest(new { message = "Username is required." });

                if (string.IsNullOrWhiteSpace(updatedUser.Email))
                    return BadRequest(new { message = "Email address is required." });

                if (!new EmailAddressAttribute().IsValid(updatedUser.Email))
                    return BadRequest(new { message = "Please enter a valid email address." });

                if (updatedUser.RoleId <= 0)
                    return BadRequest(new { message = "Please select a valid role." });

                bool validRole = await _context.Roles
                    .AnyAsync(r => r.RoleId == updatedUser.RoleId);

                if (!validRole)
                    return BadRequest(new { message = "The selected role does not exist." });

                if (!string.IsNullOrWhiteSpace(updatedUser.Password) &&
                    updatedUser.Password.Length < 6)
                {
                    return BadRequest(new
                    {
                        message = "Password must be at least 6 characters."
                    });
                }

                bool duplicateUser = await _context.Users
                    .AnyAsync(u => u.UserName == updatedUser.UserName &&
                                   u.UserId != id);

                if (duplicateUser)
                    return BadRequest(new { message = "Username already exists for another user." });

                bool duplicateEmail = await _context.Users
                    .AnyAsync(u => u.Email != null &&
                                   u.Email.ToLower() == updatedUser.Email &&
                                   u.UserId != id);

                if (duplicateEmail)
                    return BadRequest(new { message = "Email address is already registered to another user." });

                // Explicitly assign all editable fields
                user.Name = updatedUser.Name;
                user.UserName = updatedUser.UserName;
                user.Email = updatedUser.Email;
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
                    email = user.Email,
                    roleId = user.RoleId,
                    status = user.Status
                });
            }
            catch (DbUpdateException ex)
            {
                Console.Error.WriteLine(ex);

                return BadRequest(new
                {
                    message = "Could not update the user. Check the username, email and selected role."
                });
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine(ex);

                return StatusCode(500, new
                {
                    message = "Failed to update user."
                });
            }
        }

        // DELETE USER
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            try
            {
                var user = await _context.Users.FindAsync(id);

                if (user == null)
                {
                    return NotFound(new { message = "User not found." });
                }

                bool hasSales = await _context.Sales
                    .AnyAsync(s => s.UserId == id);

                bool hasStockTransactions = await _context.StockTransactions
                    .AnyAsync(t => t.UserId == id);

                if (hasSales || hasStockTransactions)
                {
                    return BadRequest(new
                    {
                        message = "This user cannot be deleted because it is used by existing sales or stock transactions."
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
            catch (DbUpdateException ex)
            {
                Console.Error.WriteLine(ex);

                return BadRequest(new
                {
                    message = "This user cannot be deleted because it is currently used by other records in the system."
                });
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine(ex);

                return StatusCode(500, new
                {
                    message = "Failed to delete user."
                });
            }
        }
    }

    public class LoginRequest
    {
        public string UserName { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}