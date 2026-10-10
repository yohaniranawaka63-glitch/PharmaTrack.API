using System.Data;
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

        // GET: api/Sale
        [HttpGet]
        public async Task<IActionResult> GetSales()
        {
            var sales = await _context.Sales
                .AsNoTracking()
                .OrderByDescending(s => s.SaleDate)
                .ToListAsync();

            return Ok(sales);
        }

        // GET: api/Sale/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetSale(int id)
        {
            var sale = await _context.Sales
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.SaleId == id);

            if (sale == null)
            {
                return NotFound(new
                {
                    message = "Sale not found."
                });
            }

            return Ok(sale);
        }

        // GET: api/Sale/{id}/Items
        [HttpGet("{id}/Items")]
        public async Task<IActionResult> GetSaleItems(int id)
        {
            var saleExists = await _context.Sales
                .AnyAsync(s => s.SaleId == id);

            if (!saleExists)
            {
                return NotFound(new
                {
                    message = "Sale not found."
                });
            }

            var items = await (
                from saleItem in _context.SaleItem

                join batch in _context.MedicineBatches
                    on saleItem.BatchId equals (int?)batch.BatchId
                    into batchGroup

                from batch in batchGroup.DefaultIfEmpty()

                join medicine in _context.Medicines
                    on batch.MedicineId equals medicine.MedicineId
                    into medicineGroup

                from medicine in medicineGroup.DefaultIfEmpty()

                join otherItem in _context.OtherItems
                    on saleItem.OtherItemId equals (int?)otherItem.OtherItemId
                    into otherItemGroup

                from otherItem in otherItemGroup.DefaultIfEmpty()

                where saleItem.SaleId == id

                select new
                {
                    saleItemId = saleItem.SaleItemId,

                    itemName = medicine != null
                        ? medicine.Name
                        : otherItem != null
                            ? otherItem.ItemName
                            : "Unknown Item",

                    type = saleItem.BatchId.HasValue
                        ? "Medicine"
                        : "Other Item",

                    quantity = saleItem.Quantity,
                    unitPrice = saleItem.UnitPrice,
                    subTotal = saleItem.SubTotal,
                    purchasePriceAtSale = saleItem.PurchasePriceAtSale
                }
            ).ToListAsync();

            return Ok(items);
        }

        // POST: api/Sale
        [HttpPost]
        public async Task<IActionResult> CreateSale(
            [FromBody] CreateSaleRequest request)
        {
            if (request == null)
            {
                return BadRequest(new
                {
                    message = "Invalid sale request."
                });
            }

            if (request.UserId <= 0)
            {
                return BadRequest(new
                {
                    message = "A valid user is required."
                });
            }

            if (request.Items == null || request.Items.Count == 0)
            {
                return BadRequest(new
                {
                    message = "Sale must contain at least one item."
                });
            }

            if (string.IsNullOrWhiteSpace(request.PaymentMethod))
            {
                return BadRequest(new
                {
                    message = "Payment method is required."
                });
            }

            var paymentMethod = request.PaymentMethod.Trim();

            if (!paymentMethod.Equals("Cash", StringComparison.OrdinalIgnoreCase) &&
                !paymentMethod.Equals("Card", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new
                {
                    message = "Payment method must be Cash or Card."
                });
            }

            foreach (var item in request.Items)
            {
                if (item.Quantity <= 0)
                {
                    return BadRequest(new
                    {
                        message = "Quantity must be greater than zero."
                    });
                }

                if (item.BatchId.HasValue == item.OtherItemId.HasValue)
                {
                    return BadRequest(new
                    {
                        message = "Each sale item must contain either BatchId or OtherItemId, but not both."
                    });
                }

                if (item.BatchId.HasValue && item.BatchId.Value <= 0)
                {
                    return BadRequest(new
                    {
                        message = "Invalid medicine batch ID."
                    });
                }

                if (item.OtherItemId.HasValue && item.OtherItemId.Value <= 0)
                {
                    return BadRequest(new
                    {
                        message = "Invalid other item ID."
                    });
                }
            }

            List<CreateSaleItemRequest> saleItems;

            try
            {
                saleItems = request.Items
                    .GroupBy(item => new
                    {
                        item.BatchId,
                        item.OtherItemId
                    })
                    .Select(group => new CreateSaleItemRequest
                    {
                        BatchId = group.Key.BatchId,
                        OtherItemId = group.Key.OtherItemId,
                        Quantity = group.Sum(item => item.Quantity)
                    })
                    .ToList();
            }
            catch (OverflowException)
            {
                return BadRequest(new
                {
                    message = "The requested quantity is too large."
                });
            }

            await using var transaction =
                await _context.Database.BeginTransactionAsync(
                    IsolationLevel.Serializable);

            try
            {
                // Validate that the user exists and is active.
                var userExists = await _context.Users
                    .AnyAsync(u =>
                        u.UserId == request.UserId &&
                        u.Status);

                if (!userExists)
                {
                    await transaction.RollbackAsync();

                    return BadRequest(new
                    {
                        message = "The selected user does not exist or is inactive. Please log in again."
                    });
                }

                decimal totalAmount = 0;

                // Validate every item before changing stock.
                foreach (var item in saleItems)
                {
                    if (item.BatchId.HasValue)
                    {
                        var batch = await _context.MedicineBatches
                            .FirstOrDefaultAsync(b =>
                                b.BatchId == item.BatchId.Value);

                        if (batch == null)
                        {
                            await transaction.RollbackAsync();

                            return BadRequest(new
                            {
                                message = $"Medicine batch {item.BatchId.Value} not found."
                            });
                        }

                        if (!batch.IsActive)
                        {
                            await transaction.RollbackAsync();

                            return BadRequest(new
                            {
                                message = $"Medicine batch {batch.BatchName} is inactive."
                            });
                        }

                        // Prevent sales of inactive medicines.
                        var medicine = await _context.Medicines
                            .FirstOrDefaultAsync(m =>
                                m.MedicineId == batch.MedicineId);

                        if (medicine == null || !medicine.IsActive)
                        {
                            await transaction.RollbackAsync();

                            return BadRequest(new
                            {
                                message = "This medicine is inactive and cannot be sold. Please remove it from the bill."
                            });
                        }

                        // Prevent sales of expired batches.
                        if (batch.ExpiryDate.Date < DateTime.Today)
                        {
                            await transaction.RollbackAsync();

                            return BadRequest(new
                            {
                                message = $"Batch {batch.BatchName} of {medicine.Name} has expired and cannot be sold."
                            });
                        }

                        if (batch.Quantity < item.Quantity)
                        {
                            await transaction.RollbackAsync();

                            return BadRequest(new
                            {
                                message = $"Insufficient stock for {medicine.Name}. Available stock: {batch.Quantity}"
                            });
                        }

                        if (batch.SellingPrice <= 0 ||
                            batch.PurchasePrice < 0)
                        {
                            await transaction.RollbackAsync();

                            return BadRequest(new
                            {
                                message = $"Invalid price for batch {batch.BatchName}."
                            });
                        }

                        totalAmount += batch.SellingPrice * item.Quantity;
                    }
                    else
                    {
                        var otherItemId = item.OtherItemId!.Value;

                        var otherItem = await _context.OtherItems
                            .FirstOrDefaultAsync(i =>
                                i.OtherItemId == otherItemId);

                        if (otherItem == null)
                        {
                            await transaction.RollbackAsync();

                            return BadRequest(new
                            {
                                message = $"Other item {otherItemId} not found."
                            });
                        }

                        if (!otherItem.Status)
                        {
                            await transaction.RollbackAsync();

                            return BadRequest(new
                            {
                                message = $"Other item {otherItem.ItemName} is inactive."
                            });
                        }

                        if (otherItem.Quantity < item.Quantity)
                        {
                            await transaction.RollbackAsync();

                            return BadRequest(new
                            {
                                message = $"Insufficient stock for {otherItem.ItemName}. Available stock: {otherItem.Quantity}"
                            });
                        }

                        if (otherItem.SellingPrice <= 0 ||
                            otherItem.PurchasePrice < 0)
                        {
                            await transaction.RollbackAsync();

                            return BadRequest(new
                            {
                                message = $"Invalid price for {otherItem.ItemName}."
                            });
                        }

                        totalAmount += otherItem.SellingPrice * item.Quantity;
                    }
                }

                // Create sale only after all items pass validation.
                var sale = new Sale
                {
                    UserId = request.UserId,
                    SaleDate = DateTime.UtcNow,
                    TotalAmount = totalAmount,
                    PaymentMethod = paymentMethod.Equals(
                        "Cash",
                        StringComparison.OrdinalIgnoreCase)
                            ? "Cash"
                            : "Card"
                };

                _context.Sales.Add(sale);
                await _context.SaveChangesAsync();

                // Add sale items and deduct stock.
                foreach (var item in saleItems)
                {
                    if (item.BatchId.HasValue)
                    {
                        var batch = await _context.MedicineBatches
                            .FirstAsync(b =>
                                b.BatchId == item.BatchId.Value);

                        _context.SaleItem.Add(new SaleItem
                        {
                            SaleId = sale.SaleId,
                            BatchId = batch.BatchId,
                            OtherItemId = null,
                            Quantity = item.Quantity,
                            UnitPrice = batch.SellingPrice,
                            SubTotal = batch.SellingPrice * item.Quantity,
                            PurchasePriceAtSale = batch.PurchasePrice
                        });

                        batch.Quantity -= item.Quantity;
                    }
                    else
                    {
                        var otherItem = await _context.OtherItems
                            .FirstAsync(i =>
                                i.OtherItemId == item.OtherItemId!.Value);

                        _context.SaleItem.Add(new SaleItem
                        {
                            SaleId = sale.SaleId,
                            BatchId = null,
                            OtherItemId = otherItem.OtherItemId,
                            Quantity = item.Quantity,
                            UnitPrice = otherItem.SellingPrice,
                            SubTotal = otherItem.SellingPrice * item.Quantity,
                            PurchasePriceAtSale = otherItem.PurchasePrice
                        });

                        otherItem.Quantity -= item.Quantity;
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new
                {
                    message = "Sale created successfully.",
                    saleId = sale.SaleId,
                    totalAmount = sale.TotalAmount,
                    paymentMethod = sale.PaymentMethod
                });
            }
            catch (Exception error)
            {
                try
                {
                    await transaction.RollbackAsync();
                }
                catch (Exception rollbackError)
                {
                    Console.Error.WriteLine(
                        $"Sale rollback error: {rollbackError.Message}");
                }

                Console.Error.WriteLine($"Create sale error: {error}");

                _context.ChangeTracker.Clear();

                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        message = "The sale could not be completed. Please check the server log and try again."
                    });
            }
        }
    }

    public class CreateSaleRequest
    {
        public int UserId { get; set; }

        public string PaymentMethod { get; set; } = string.Empty;

        public List<CreateSaleItemRequest> Items { get; set; } =
            new List<CreateSaleItemRequest>();
    }

    public class CreateSaleItemRequest
    {
        public int? BatchId { get; set; }

        public int? OtherItemId { get; set; }

        public int Quantity { get; set; }
    }
}