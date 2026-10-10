using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PharmaTrack.API.Data;

namespace PharmaTrack.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class StockController : ControllerBase
    {
        private readonly PharmaTrackDbContext _context;

        public StockController(PharmaTrackDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // GET: api/Stock/Medicines
        // =========================================================

        [HttpGet("Medicines")]
        public async Task<IActionResult> GetMedicineStock()
        {
            var stock = await (
                from batch in _context.MedicineBatches

                join medicine in _context.Medicines
                    on batch.MedicineId equals medicine.MedicineId

                join supplier in _context.Suppliers
                    on batch.SupplierId equals supplier.SupplierId

                where medicine.IsActive
                      && batch.IsActive

                select new
                {
                    type = "Medicine",

                    id = batch.BatchId,

                    medicineId = medicine.MedicineId,

                    name = medicine.Name,

                    genericName = medicine.GenericName,

                    category = medicine.Category,

                    unit = medicine.Unit,

                    strength = medicine.Strength,

                    batchName = batch.BatchName,

                    supplierId = supplier.SupplierId,

                    supplier = supplier.SupplierName,

                    manufacturingDate = batch.ManufacturingDate,

                    expiryDate = batch.ExpiryDate,

                    purchasePrice = batch.PurchasePrice,

                    sellingPrice = batch.SellingPrice,

                    quantity = batch.Quantity
                }
            ).ToListAsync();

            return Ok(stock);
        }

        // =========================================================
        // GET: api/Stock/OtherItems
        // =========================================================

        [HttpGet("OtherItems")]
        public async Task<IActionResult> GetOtherItemStock()
        {
            var stock = await _context.OtherItems
                .Where(item => item.Status)
                .Select(item => new
                {
                    type = "Other Item",

                    id = item.OtherItemId,

                    name = item.ItemName,

                    productCategoryId = item.ProductCategoryId,

                    productCategoryName =
                        item.ProductCategory != null
                            ? item.ProductCategory.CategoryName
                            : null,

                    category = item.Category,

                    unit = item.Unit,

                    purchasePrice = item.PurchasePrice,

                    sellingPrice = item.SellingPrice,

                    quantity = item.Quantity,

                    reorderLevel = item.ReorderLevel,

                    status = item.Status
                })
                .ToListAsync();

            return Ok(stock);
        }
    }
}