using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PharmaTrack.API.Data;
using PharmaTrack.API.Models;

namespace PharmaTrack.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SaleController : ControllerBase
    {
        private readonly PharmaTrackDbContext _context;

        public SaleController(PharmaTrackDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetSales()
        {
            var sales = await _context.Sales.ToListAsync();

            return Ok(sales);
        }

        [HttpPost]
        public async Task<IActionResult> CreateSale([FromBody] Sale sale)
        {
            sale.SaleDate = DateTime.SpecifyKind(
                sale.SaleDate,
                DateTimeKind.Utc
            );

            _context.Sales.Add(sale);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Sale created successfully.",
                saleId = sale.SaleId,
                userId = sale.UserId,
                saleDate = sale.SaleDate,
                totalAmount = sale.TotalAmount,
                paymentMethod = sale.PaymentMethod
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateSale(
            int id,
            [FromBody] Sale updatedSale)
        {
            var sale = await _context.Sales.FindAsync(id);

            if (sale == null)
            {
                return NotFound(new
                {
                    message = "Sale not found."
                });
            }

            sale.UserId = updatedSale.UserId;

            sale.SaleDate = DateTime.SpecifyKind(
                updatedSale.SaleDate,
                DateTimeKind.Utc
            );

            sale.TotalAmount = updatedSale.TotalAmount;
            sale.PaymentMethod = updatedSale.PaymentMethod;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Sale updated successfully.",
                saleId = sale.SaleId,
                userId = sale.UserId,
                saleDate = sale.SaleDate,
                totalAmount = sale.TotalAmount,
                paymentMethod = sale.PaymentMethod
            });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSale(int id)
        {
            var sale = await _context.Sales.FindAsync(id);

            if (sale == null)
            {
                return NotFound(new
                {
                    message = "Sale not found."
                });
            }

            _context.Sales.Remove(sale);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Sale deleted successfully.",
                saleId = id
            });
        }
    }
}