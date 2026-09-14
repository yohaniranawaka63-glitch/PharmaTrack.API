using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PharmaTrack.API.Data;
using PharmaTrack.API.Models;

namespace PharmaTrack.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RoleController : ControllerBase
    {
        private readonly PharmaTrackDbContext _context;

        public RoleController(PharmaTrackDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetRoles()
        {
            var roles = await _context.Roles.ToListAsync();

            return Ok(roles);
        }

        [HttpPost]
        public async Task<IActionResult> CreateRole([FromBody] Role role)
        {
            _context.Roles.Add(role);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Role created successfully.",
                roleId = role.RoleId,
                roleName = role.RoleName
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRole(
            int id,
            [FromBody] Role updatedRole)
        {
            var role = await _context.Roles.FindAsync(id);

            if (role == null)
            {
                return NotFound(new
                {
                    message = "Role not found."
                });
            }

            role.RoleName = updatedRole.RoleName;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Role updated successfully.",
                roleId = role.RoleId,
                roleName = role.RoleName
            });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRole(int id)
        {
            var role = await _context.Roles.FindAsync(id);

            if (role == null)
            {
                return NotFound(new
                {
                    message = "Role not found."
                });
            }

            _context.Roles.Remove(role);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Role deleted successfully.",
                roleId = id
            });
        }
    }
}