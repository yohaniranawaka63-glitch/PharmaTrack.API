using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PharmaTrack.API.Data;
using PharmaTrack.API.Models;

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

        [HttpPost]
        public async Task<IActionResult> CreateStockTransaction(
            [FromBody] StockTransaction transaction)
        {
            transaction.TransactionDate = DateTime.SpecifyKind(
                transaction.TransactionDate,
                DateTimeKind.Utc
            );

            _context.StockTransactions.Add(transaction);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Stock transaction created successfully.",
                transactionId = transaction.TransactionId,
                batchId = transaction.BatchId,
                userId = transaction.UserId,
                transactionType = transaction.TransactionType,
                quantity = transaction.Quantity,
                transactionDate = transaction.TransactionDate,
                note = transaction.Note
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateStockTransaction(
            int id,
            [FromBody] StockTransaction updatedTransaction)
        {
            var transaction = await _context.StockTransactions.FindAsync(id);

            if (transaction == null)
            {
                return NotFound(new
                {
                    message = "Stock transaction not found."
                });
            }

            transaction.BatchId = updatedTransaction.BatchId;
            transaction.UserId = updatedTransaction.UserId;
            transaction.TransactionType = updatedTransaction.TransactionType;
            transaction.Quantity = updatedTransaction.Quantity;

            transaction.TransactionDate = DateTime.SpecifyKind(
                updatedTransaction.TransactionDate,
                DateTimeKind.Utc
            );

            transaction.Note = updatedTransaction.Note;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Stock transaction updated successfully.",
                transactionId = transaction.TransactionId,
                batchId = transaction.BatchId,
                userId = transaction.UserId,
                transactionType = transaction.TransactionType,
                quantity = transaction.Quantity,
                transactionDate = transaction.TransactionDate,
                note = transaction.Note
            });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteStockTransaction(int id)
        {
            var transaction = await _context.StockTransactions.FindAsync(id);

            if (transaction == null)
            {
                return NotFound(new
                {
                    message = "Stock transaction not found."
                });
            }

            _context.StockTransactions.Remove(transaction);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Stock transaction deleted successfully.",
                transactionId = id
            });
        }
    }
}