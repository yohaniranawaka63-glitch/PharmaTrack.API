using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PharmaTrack.API.Data;

namespace PharmaTrack.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class StockTransactionController : ControllerBase
    {
        private readonly PharmaTrackDbContext _context;

        public StockTransactionController(PharmaTrackDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetStockTransactions()
        {
            var transactions = await _context.StockTransactions.ToListAsync();

            return Ok(transactions);
        }
    }
}