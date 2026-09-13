using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PharmaTrack.API.Data;
using PharmaTrack.API.Models;

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

        [HttpPost]
public async Task<IActionResult> CreateMedicineBatch(
    [FromBody] MedicineBatch medicineBatch)
{
    medicineBatch.ManufacturingDate =
        DateTime.SpecifyKind(
            medicineBatch.ManufacturingDate,
            DateTimeKind.Utc
        );

    medicineBatch.ExpiryDate =
        DateTime.SpecifyKind(
            medicineBatch.ExpiryDate,
            DateTimeKind.Utc
        );

    _context.MedicineBatches.Add(medicineBatch);

    await _context.SaveChangesAsync();

    return Ok(new
    {
        message = "Medicine batch created successfully.",
        batchId = medicineBatch.BatchId,
        medicineId = medicineBatch.MedicineId,
        supplierId = medicineBatch.SupplierId,
        batchName = medicineBatch.BatchName,
        manufacturingDate = medicineBatch.ManufacturingDate,
        expiryDate = medicineBatch.ExpiryDate,
        purchasePrice = medicineBatch.PurchasePrice,
        sellingPrice = medicineBatch.SellingPrice,
        quantity = medicineBatch.Quantity
    });
}

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateMedicineBatch(
            int id,
            [FromBody] MedicineBatch updatedBatch)
        {
            var medicineBatch = await _context.MedicineBatches.FindAsync(id);

            if (medicineBatch == null)
            {
                return NotFound(new
                {
                    message = "Medicine batch not found."
                });
            }

            medicineBatch.MedicineId = updatedBatch.MedicineId;
            medicineBatch.SupplierId = updatedBatch.SupplierId;
            medicineBatch.BatchName = updatedBatch.BatchName;
            medicineBatch.ManufacturingDate = updatedBatch.ManufacturingDate;
            medicineBatch.ExpiryDate = updatedBatch.ExpiryDate;
            medicineBatch.PurchasePrice = updatedBatch.PurchasePrice;
            medicineBatch.SellingPrice = updatedBatch.SellingPrice;
            medicineBatch.Quantity = updatedBatch.Quantity;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Medicine batch updated successfully.",
                batchId = medicineBatch.BatchId,
                medicineId = medicineBatch.MedicineId,
                supplierId = medicineBatch.SupplierId,
                batchName = medicineBatch.BatchName,
                manufacturingDate = medicineBatch.ManufacturingDate,
                expiryDate = medicineBatch.ExpiryDate,
                purchasePrice = medicineBatch.PurchasePrice,
                sellingPrice = medicineBatch.SellingPrice,
                quantity = medicineBatch.Quantity
            });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMedicineBatch(int id)
        {
            var medicineBatch = await _context.MedicineBatches.FindAsync(id);

            if (medicineBatch == null)
            {
                return NotFound(new
                {
                    message = "Medicine batch not found."
                });
            }

            _context.MedicineBatches.Remove(medicineBatch);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Medicine batch deleted successfully.",
                batchId = id
            });
        }
    }
}