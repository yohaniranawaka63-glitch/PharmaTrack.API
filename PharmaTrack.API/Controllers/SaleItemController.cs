using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PharmaTrack.API.Data;

namespace PharmaTrack.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SaleItemController : ControllerBase
    {
        private readonly PharmaTrackDbContext _context;

        public SaleItemController(PharmaTrackDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetSaleItems()
        {
            var saleItems = await _context.SaleItem.ToListAsync();

            return Ok(saleItems);
        }
    }
}