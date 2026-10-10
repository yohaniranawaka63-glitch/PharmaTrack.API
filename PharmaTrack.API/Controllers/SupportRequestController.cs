
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PharmaTrack.API.Data;
using PharmaTrack.API.Models;

namespace PharmaTrack.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SupportRequestController : ControllerBase
    {
        private readonly PharmaTrackDbContext _context;

        public SupportRequestController(PharmaTrackDbContext context)
        {
            _context = context;
        }

        // GET: api/SupportRequest
        [HttpGet]
        public async Task<IActionResult> GetSupportRequests()
        {
            var requests = await _context.SupportRequests
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync();

            return Ok(requests);
        }

        // GET: api/SupportRequest/1
        [HttpGet("{id}")]
        public async Task<IActionResult> GetSupportRequest(int id)
        {
            var request = await _context.SupportRequests
                .FirstOrDefaultAsync(x => x.RequestId == id);

            if (request == null)
            {
                return NotFound(new
                {
                    message = "Support request not found."
                });
            }

            return Ok(request);
        }

        // POST: api/SupportRequest
        [HttpPost]
        public async Task<IActionResult> CreateSupportRequest(
            [FromBody] SupportRequest request)
        {
            if (request.UserId <= 0)
            {
                return BadRequest(new
                {
                    message = "UserId is required."
                });
            }

            if (string.IsNullOrWhiteSpace(request.RequestType))
            {
                return BadRequest(new
                {
                    message = "Request type is required."
                });
            }

            if (string.IsNullOrWhiteSpace(request.Message))
            {
                return BadRequest(new
                {
                    message = "Message is required."
                });
            }

            var userExists = await _context.Users
                .AnyAsync(x => x.UserId == request.UserId);

            if (!userExists)
            {
                return BadRequest(new
                {
                    message = "User does not exist."
                });
            }

            request.Status = "Pending";
            request.CreatedAt = DateTime.UtcNow;
            request.ResolvedAt = null;

            _context.SupportRequests.Add(request);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Support request created successfully.",
                requestId = request.RequestId
            });
        }

        // PUT: api/SupportRequest/1/status
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(
            int id,
            [FromBody] string status)
        {
            var request = await _context.SupportRequests
                .FirstOrDefaultAsync(x => x.RequestId == id);

            if (request == null)
            {
                return NotFound(new
                {
                    message = "Support request not found."
                });
            }

            if (status != "Pending" &&
                status != "In Progress" &&
                status != "Resolved")
            {
                return BadRequest(new
                {
                    message = "Invalid status."
                });
            }

            request.Status = status;

            if (status == "Resolved")
            {
                request.ResolvedAt = DateTime.UtcNow;
            }
            else
            {
                request.ResolvedAt = null;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Status updated successfully.",
                requestId = request.RequestId,
                status = request.Status
            });
        }

        // DELETE: api/SupportRequest/1
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSupportRequest(int id)
        {
            var request = await _context.SupportRequests
                .FirstOrDefaultAsync(x => x.RequestId == id);

            if (request == null)
            {
                return NotFound(new
                {
                    message = "Support request not found."
                });
            }

            _context.SupportRequests.Remove(request);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Support request deleted successfully."
            });
        }
    }
}