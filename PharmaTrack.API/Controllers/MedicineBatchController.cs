using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PharmaTrack.API.Data;

namespace PharmaTrack.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MedicineBatchController : ControllerBase
    {
        private readonly PharmaTrackDbContext _context;

        public MedicineBatchController(PharmaTrackDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetMedicineBatches()
        {
            var batches = await _context.MedicineBatches.ToListAsync();

            return Ok(batches);
        }
    }
}