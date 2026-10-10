
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

        // GET: api/MedicineBatch
        [HttpGet]
        public async Task<IActionResult> GetMedicineBatches()
        {
            var batches = await _context.MedicineBatches
                .AsNoTracking()
                .Where(b => b.IsActive)
                .ToListAsync();

            return Ok(batches);
        }

        // GET: api/MedicineBatch/ExpiryAlerts
        [HttpGet("ExpiryAlerts")]
        public async Task<IActionResult> GetExpiryAlerts()
        {
            var today = DateTime.UtcNow.Date;
            var next30Days = today.AddDays(30);

            var batches = await (
                from batch in _context.MedicineBatches.AsNoTracking()
                join medicine in _context.Medicines.AsNoTracking()
                    on batch.MedicineId equals medicine.MedicineId
                where batch.IsActive && medicine.IsActive
                select new
                {
                    batch.BatchId,
                    batch.MedicineId,
                    MedicineName = medicine.Name,
                    batch.BatchName,
                    batch.ManufacturingDate,
                    batch.ExpiryDate,
                    batch.Quantity,
                    batch.SellingPrice,
                    batch.SupplierId
                }
            ).ToListAsync();

            var expired = batches
                .Where(b => b.ExpiryDate.Date < today)
                .OrderBy(b => b.ExpiryDate)
                .ToList();

            var expiringSoon = batches
                .Where(b =>
                    b.ExpiryDate.Date >= today &&
                    b.ExpiryDate.Date <= next30Days)
                .OrderBy(b => b.ExpiryDate)
                .ToList();

            return Ok(new
            {
                checkedDate = today,
                daysAhead = 30,
                expiredCount = expired.Count,
                expiringSoonCount = expiringSoon.Count,
                expired,
                expiringSoon
            });
        }

        // POST: api/MedicineBatch
        [HttpPost]
        public async Task<IActionResult> CreateMedicineBatch(
            [FromBody] MedicineBatch medicineBatch)
        {
            if (medicineBatch.ExpiryDate.Date <
                medicineBatch.ManufacturingDate.Date)
            {
                return BadRequest(new
                {
                    message =
                        "Expiry date cannot be before manufacturing date."
                });
            }

            if (medicineBatch.Quantity < 0 ||
                medicineBatch.PurchasePrice < 0 ||
                medicineBatch.SellingPrice < 0)
            {
                return BadRequest(new
                {
                    message =
                        "Quantity and prices cannot be negative."
                });
            }

            var medicine = await _context.Medicines
                .FirstOrDefaultAsync(m =>
                    m.MedicineId == medicineBatch.MedicineId);

            if (medicine == null)
            {
                return BadRequest(new
                {
                    message = "Medicine not found."
                });
            }

            if (!medicine.IsActive)
            {
                return BadRequest(new
                {
                    message =
                        "This medicine is inactive and cannot receive a new batch."
                });
            }

            medicineBatch.IsActive = true;

            medicineBatch.ManufacturingDate =
                DateTime.SpecifyKind(
                    medicineBatch.ManufacturingDate,
                    DateTimeKind.Utc);

            medicineBatch.ExpiryDate =
                DateTime.SpecifyKind(
                    medicineBatch.ExpiryDate,
                    DateTimeKind.Utc);

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
                quantity = medicineBatch.Quantity,
                isActive = medicineBatch.IsActive
            });
        }

        // PUT: api/MedicineBatch/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateMedicineBatch(
            int id,
            [FromBody] MedicineBatch updatedBatch)
        {
            var medicineBatch = await _context.MedicineBatches
                .FirstOrDefaultAsync(b =>
                    b.BatchId == id && b.IsActive);

            if (medicineBatch == null)
            {
                return NotFound(new
                {
                    message = "Medicine batch not found."
                });
            }

            if (updatedBatch.ExpiryDate.Date <
                updatedBatch.ManufacturingDate.Date)
            {
                return BadRequest(new
                {
                    message =
                        "Expiry date cannot be before manufacturing date."
                });
            }

            if (updatedBatch.Quantity < 0 ||
                updatedBatch.PurchasePrice < 0 ||
                updatedBatch.SellingPrice < 0)
            {
                return BadRequest(new
                {
                    message =
                        "Quantity and prices cannot be negative."
                });
            }

            var medicine = await _context.Medicines
                .FirstOrDefaultAsync(m =>
                    m.MedicineId == updatedBatch.MedicineId);

            if (medicine == null)
            {
                return BadRequest(new
                {
                    message = "Medicine not found."
                });
            }

            if (!medicine.IsActive)
            {
                return BadRequest(new
                {
                    message =
                        "This medicine is inactive and cannot be used."
                });
            }

            medicineBatch.MedicineId = updatedBatch.MedicineId;
            medicineBatch.SupplierId = updatedBatch.SupplierId;
            medicineBatch.BatchName = updatedBatch.BatchName;

            medicineBatch.ManufacturingDate =
                DateTime.SpecifyKind(
                    updatedBatch.ManufacturingDate,
                    DateTimeKind.Utc);

            medicineBatch.ExpiryDate =
                DateTime.SpecifyKind(
                    updatedBatch.ExpiryDate,
                    DateTimeKind.Utc);

            medicineBatch.PurchasePrice =
                updatedBatch.PurchasePrice;

            medicineBatch.SellingPrice =
                updatedBatch.SellingPrice;

            medicineBatch.Quantity =
                updatedBatch.Quantity;

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
                quantity = medicineBatch.Quantity,
                isActive = medicineBatch.IsActive
            });
        }

        // DELETE: api/MedicineBatch/{id}
        // Soft delete: keep the database record
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMedicineBatch(int id)
        {
            var medicineBatch = await _context.MedicineBatches
                .FirstOrDefaultAsync(b => b.BatchId == id);

            if (medicineBatch == null)
            {
                return NotFound(new
                {
                    message = "Medicine batch not found."
                });
            }

            if (!medicineBatch.IsActive)
            {
                return NotFound(new
                {
                    message = "Medicine batch is already inactive."
                });
            }

            medicineBatch.IsActive = false;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Medicine batch deactivated successfully.",
                batchId = id
            });
        }
    }
}
