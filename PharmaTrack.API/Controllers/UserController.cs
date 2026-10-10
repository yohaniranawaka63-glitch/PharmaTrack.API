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

        // =========================================================
        // GET ALL USERS
        // =========================================================

        [HttpGet]
        public async Task<IActionResult> GetUsers()
        {
            try
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
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Failed to load users.",
                    error = ex.Message
                });
            }
        }

        // =========================================================
        // CREATE USER
        // =========================================================

        [HttpPost]
        public async Task<IActionResult> CreateUser(
            [FromBody] User user)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(user.Name))
                {
                    return BadRequest(new
                    {
                        message = "Name is required."
                    });
                }

                if (string.IsNullOrWhiteSpace(user.UserName))
                {
                    return BadRequest(new
                    {
                        message = "Username is required."
                    });
                }

                if (string.IsNullOrWhiteSpace(user.Password))
                {
                    return BadRequest(new
                    {
                        message = "Password is required."
                    });
                }

                if (user.RoleId <= 0)
                {
                    return BadRequest(new
                    {
                        message = "Please select a valid role."
                    });
                }

                var existingUser = await _context.Users
                    .FirstOrDefaultAsync(
                        u => u.UserName == user.UserName
                    );

                if (existingUser != null)
                {
                    return BadRequest(new
                    {
                        message = "Username already exists."
                    });
                }

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
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Failed to create user.",
                    error = ex.Message
                });
            }
        }

        // =========================================================
        // LOGIN
        // =========================================================

        [HttpPost("login")]
        public async Task<IActionResult> Login(
            [FromBody] LoginRequest request)
        {
            try
            {
                var user = await _context.Users
                    .FirstOrDefaultAsync(
                        u => u.UserName == request.UserName
                    );

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

                var result =
                    _passwordHasher.VerifyHashedPassword(
                        user,
                        user.Password,
                        request.Password
                    );

                if (result ==
                    PasswordVerificationResult.Failed)
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
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Login failed.",
                    error = ex.Message
                });
            }
        }

        // =========================================================
        // UPDATE USER
        // =========================================================

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(
            int id,
            [FromBody] User updatedUser)
        {
            try
            {
                var user = await _context.Users
                    .FindAsync(id);

                if (user == null)
                {
                    return NotFound(new
                    {
                        message = "User not found."
                    });
                }

                // Check duplicate username
                var duplicateUser =
                    await _context.Users
                        .FirstOrDefaultAsync(
                            u =>
                                u.UserName ==
                                updatedUser.UserName &&
                                u.UserId != id
                        );

                if (duplicateUser != null)
                {
                    return BadRequest(new
                    {
                        message =
                            "Username already exists for another user."
                    });
                }

                user.Name = updatedUser.Name;
                user.UserName = updatedUser.UserName;
                user.RoleId = updatedUser.RoleId;
                user.Status = updatedUser.Status;

                // Only change password if user entered one
                if (!string.IsNullOrWhiteSpace(
                    updatedUser.Password))
                {
                    user.Password =
                        _passwordHasher.HashPassword(
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
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Failed to update user.",
                    error = ex.Message
                });
            }
        }

        // =========================================================
        // DELETE USER
        // =========================================================

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            try
            {
                var user = await _context.Users
                    .FindAsync(id);

                if (user == null)
                {
                    return NotFound(new
                    {
                        message = "User not found."
                    });
                }

                // -------------------------------------------------
                // Check whether user is used in Sales
                // -------------------------------------------------

                var hasSales = await _context.Sales
                    .AnyAsync(s => s.UserId == id);

                // -------------------------------------------------
                // Check whether user is used in Stock Transactions
                // -------------------------------------------------

                var hasStockTransactions =
                    await _context.StockTransactions
                        .AnyAsync(t => t.UserId == id);

                // -------------------------------------------------
                // Do not delete if related records exist
                // -------------------------------------------------

                if (hasSales && hasStockTransactions)
                {
                    return BadRequest(new
                    {
                        message =
                            "This user cannot be deleted because it is currently used in sales and stock transactions."
                    });
                }

                if (hasSales)
                {
                    return BadRequest(new
                    {
                        message =
                            "This user cannot be deleted because it is currently used in one or more sales."
                    });
                }

                if (hasStockTransactions)
                {
                    return BadRequest(new
                    {
                        message =
                            "This user cannot be deleted because it is currently used in one or more stock transactions."
                    });
                }

                // -------------------------------------------------
                // Safe to delete
                // -------------------------------------------------

                _context.Users.Remove(user);

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "User deleted successfully.",
                    userId = id
                });
            }
            catch (DbUpdateException)
            {
                return BadRequest(new
                {
                    message =
                        "This user cannot be deleted because it is currently used by other records in the system."
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Failed to delete user.",
                    error = ex.Message
                });
            }
        }
    }

    // =========================================================
    // LOGIN REQUEST
    // =========================================================

    public class LoginRequest
    {
        public string UserName { get; set; } = string.Empty;

        public string Password { get; set; } = string.Empty;
    }
}