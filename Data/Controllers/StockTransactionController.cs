using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PharmacyAPI.Data;
using PharmacyAPI.Models;

namespace PharmacyAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class StockTransactionController : ControllerBase
    {
        private readonly AppDbContext _context;

        public StockTransactionController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<StockTransaction>>> GetStockTransactions()
        {
            return await _context.StockTransactions.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<StockTransaction>> GetStockTransaction(int id)
        {
            var transaction = await _context.StockTransactions.FindAsync(id);

            if (transaction == null)
            {
                return NotFound();
            }

            return transaction;
        }

        [HttpPost]
        public async Task<ActionResult<StockTransaction>> CreateStockTransaction(
            StockTransaction transaction)
        {
            _context.StockTransactions.Add(transaction);
            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetStockTransaction),
                new { id = transaction.TransactionId },
                transaction
            );
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateStockTransaction(
            int id,
            StockTransaction transaction)
        {
            if (id != transaction.TransactionId)
            {
                return BadRequest();
            }

            _context.Entry(transaction).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!StockTransactionExists(id))
                {
                    return NotFound();
                }

                throw;
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteStockTransaction(int id)
        {
            var transaction = await _context.StockTransactions.FindAsync(id);

            if (transaction == null)
            {
                return NotFound();
            }

            _context.StockTransactions.Remove(transaction);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool StockTransactionExists(int id)
        {
            return _context.StockTransactions.Any(
                e => e.TransactionId == id
            );
        }
    }
}