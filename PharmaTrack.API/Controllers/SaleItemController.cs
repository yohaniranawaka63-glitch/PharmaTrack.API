
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
            var saleItems = await _context.SaleItem
                .AsNoTracking()
                .OrderByDescending(x => x.SaleItemId)
                .ToListAsync();

            return Ok(saleItems);
        }

        [HttpPost]
        public async Task<IActionResult> CreateSaleItem(
            [FromBody] SaleItem saleItem)
        {
            if (saleItem == null || saleItem.Quantity <= 0)
            {
                return BadRequest(new
                {
                    message = "A valid sale item and quantity are required."
                });
            }

            if (saleItem.BatchId.HasValue ==
                saleItem.OtherItemId.HasValue)
            {
                return BadRequest(new
                {
                    message = "Select either a medicine batch or an other item."
                });
            }

            var saleExists = await _context.Sales
                .AnyAsync(s => s.SaleId == saleItem.SaleId);

            if (!saleExists)
            {
                return BadRequest(new
                {
                    message = "The selected sale does not exist."
                });
            }

            decimal purchasePrice;

            if (saleItem.BatchId.HasValue)
            {
                var batch = await _context.MedicineBatches
                    .FirstOrDefaultAsync(b =>
                        b.BatchId == saleItem.BatchId.Value);

                if (batch == null)
                {
                    return BadRequest(new
                    {
                        message = "Medicine batch not found."
                    });
                }

                purchasePrice = batch.PurchasePrice;
            }
            else if (saleItem.OtherItemId.HasValue)
            {
                var otherItemId = saleItem.OtherItemId.Value;
                var otherItem = await _context.OtherItems
                    .FirstOrDefaultAsync(i =>
                        i.OtherItemId == otherItemId);

                if (otherItem == null)
                {
                    return BadRequest(new
                    {
                        message = "Other item not found."
                    });
                }

                purchasePrice = otherItem.PurchasePrice;
            }
            else
            {
                return BadRequest(new
                {
                    message = "Select either a medicine batch or an other item."
                });
            }

            saleItem.PurchasePriceAtSale = purchasePrice;
            saleItem.SubTotal = saleItem.Quantity * saleItem.UnitPrice;

            _context.SaleItem.Add(saleItem);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Sale item created successfully.",
                saleItemId = saleItem.SaleItemId,
                saleId = saleItem.SaleId,
                batchId = saleItem.BatchId,
                otherItemId = saleItem.OtherItemId,
                quantity = saleItem.Quantity,
                unitPrice = saleItem.UnitPrice,
                subTotal = saleItem.SubTotal,
                purchasePriceAtSale = saleItem.PurchasePriceAtSale
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateSaleItem(
            int id,
            [FromBody] SaleItem updatedSaleItem)
        {
            if (updatedSaleItem == null ||
                updatedSaleItem.Quantity <= 0)
            {
                return BadRequest(new
                {
                    message = "A valid sale item and quantity are required."
                });
            }

            if (updatedSaleItem.BatchId.HasValue ==
                updatedSaleItem.OtherItemId.HasValue)
            {
                return BadRequest(new
                {
                    message = "Select either a medicine batch or an other item."
                });
            }

            var saleItem = await _context.SaleItem.FindAsync(id);

            if (saleItem == null)
            {
                return NotFound(new
                {
                    message = "Sale item not found."
                });
            }

            var saleExists = await _context.Sales
                .AnyAsync(s => s.SaleId == updatedSaleItem.SaleId);

            if (!saleExists)
            {
                return BadRequest(new
                {
                    message = "The selected sale does not exist."
                });
            }

            bool itemChanged =
                saleItem.BatchId != updatedSaleItem.BatchId ||
                saleItem.OtherItemId != updatedSaleItem.OtherItemId;

            if (itemChanged)
            {
                if (updatedSaleItem.BatchId.HasValue)
                {
                    var batch = await _context.MedicineBatches
                        .FirstOrDefaultAsync(b =>
                            b.BatchId == updatedSaleItem.BatchId.Value);

                    if (batch == null)
                    {
                        return BadRequest(new
                        {
                            message = "Medicine batch not found."
                        });
                    }

                    saleItem.PurchasePriceAtSale = batch.PurchasePrice;
                }
                else
                {
                    var otherItemId = updatedSaleItem.OtherItemId ??
                        throw new InvalidOperationException(
                            "Other item id is required when no medicine batch is selected.");

                    var otherItem = await _context.OtherItems
                        .FirstOrDefaultAsync(i =>
                            i.OtherItemId == otherItemId);

                    if (otherItem == null)
                    {
                        return BadRequest(new
                        {
                            message = "Other item not found."
                        });
                    }

                    saleItem.PurchasePriceAtSale = otherItem.PurchasePrice;
                }
            }

            saleItem.SaleId = updatedSaleItem.SaleId;
            saleItem.BatchId = updatedSaleItem.BatchId;
            saleItem.OtherItemId = updatedSaleItem.OtherItemId;
            saleItem.Quantity = updatedSaleItem.Quantity;
            saleItem.UnitPrice = updatedSaleItem.UnitPrice;
            saleItem.SubTotal =
                updatedSaleItem.Quantity * updatedSaleItem.UnitPrice;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Sale item updated successfully.",
                saleItemId = saleItem.SaleItemId,
                saleId = saleItem.SaleId,
                batchId = saleItem.BatchId,
                otherItemId = saleItem.OtherItemId,
                quantity = saleItem.Quantity,
                unitPrice = saleItem.UnitPrice,
                subTotal = saleItem.SubTotal,
                purchasePriceAtSale = saleItem.PurchasePriceAtSale
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
