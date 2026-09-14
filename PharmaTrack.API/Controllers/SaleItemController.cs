using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PharmaTrack.API.Data;
using PharmaTrack.API.Models;

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

        [HttpPost]
        public async Task<IActionResult> CreateSaleItem(
            [FromBody] SaleItem saleItem)
        {
            _context.SaleItem.Add(saleItem);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Sale item created successfully.",
                saleItemId = saleItem.SaleItemId,
                saleId = saleItem.SaleId,
                batchId = saleItem.BatchId,
                quantity = saleItem.Quantity,
                unitPrice = saleItem.UnitPrice,
                subTotal = saleItem.SubTotal
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateSaleItem(
            int id,
            [FromBody] SaleItem updatedSaleItem)
        {
            var saleItem = await _context.SaleItem.FindAsync(id);

            if (saleItem == null)
            {
                return NotFound(new
                {
                    message = "Sale item not found."
                });
            }

            saleItem.SaleId = updatedSaleItem.SaleId;
            saleItem.BatchId = updatedSaleItem.BatchId;
            saleItem.Quantity = updatedSaleItem.Quantity;
            saleItem.UnitPrice = updatedSaleItem.UnitPrice;
            saleItem.SubTotal = updatedSaleItem.SubTotal;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Sale item updated successfully.",
                saleItemId = saleItem.SaleItemId,
                saleId = saleItem.SaleId,
                batchId = saleItem.BatchId,
                quantity = saleItem.Quantity,
                unitPrice = saleItem.UnitPrice,
                subTotal = saleItem.SubTotal
            });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSaleItem(int id)
        {
            var saleItem = await _context.SaleItem.FindAsync(id);

            if (saleItem == null)
            {
                return NotFound(new
                {
                    message = "Sale item not found."
                });
            }

            _context.SaleItem.Remove(saleItem);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Sale item deleted successfully.",
                saleItemId = id
            });
        }
    }
}