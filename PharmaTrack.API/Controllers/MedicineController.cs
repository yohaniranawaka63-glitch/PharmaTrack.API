using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PharmaTrack.API.Data;
using PharmaTrack.API.Models;

namespace PharmaTrack.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MedicineController : ControllerBase
    {
        private readonly PharmaTrackDbContext _context;

        public MedicineController(PharmaTrackDbContext context)
        {
            _context = context;
        }

        // GET: api/Medicine
        [HttpGet]
        public async Task<IActionResult> GetMedicines()
        {
            var medicines = await _context.Medicines
                .AsNoTracking()
                .Where(m => m.IsActive)
                .OrderBy(m => m.Name)
                .ToListAsync();

            return Ok(medicines);
        }

        // GET: api/Medicine/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetMedicine(int id)
        {
            var medicine = await _context.Medicines
                .AsNoTracking()
                .FirstOrDefaultAsync(m =>
                    m.MedicineId == id && m.IsActive);

            if (medicine == null)
            {
                return NotFound(new
                {
                    message = "Medicine not found or inactive."
                });
            }

            return Ok(medicine);
        }

        // POST: api/Medicine
        [HttpPost]
        public async Task<IActionResult> CreateMedicine(
            [FromBody] Medicine medicine)
        {
            if (medicine == null)
            {
                return BadRequest(new
                {
                    message = "Invalid medicine data."
                });
            }

            if (string.IsNullOrWhiteSpace(medicine.Name))
            {
                return BadRequest(new
                {
                    message = "Medicine name is required."
                });
            }

            var medicineName = medicine.Name.Trim();

            var exists = await _context.Medicines.AnyAsync(m =>
                m.IsActive &&
                m.Name.ToLower() == medicineName.ToLower());

            if (exists)
            {
                return BadRequest(new
                {
                    message = "An active medicine with this name already exists."
                });
            }

            medicine.Name = medicineName;
            medicine.GenericName =
                medicine.GenericName?.Trim() ?? "";
            medicine.Category =
                medicine.Category?.Trim() ?? "";
            medicine.Unit =
                medicine.Unit?.Trim() ?? "";
            medicine.Strength =
                medicine.Strength?.Trim() ?? "";
            medicine.IsActive = true;

            _context.Medicines.Add(medicine);
            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetMedicine),
                new { id = medicine.MedicineId },
                medicine);
        }

        // PUT: api/Medicine/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateMedicine(
            int id,
            [FromBody] Medicine updatedMedicine)
        {
            if (updatedMedicine == null)
            {
                return BadRequest(new
                {
                    message = "Invalid medicine data."
                });
            }

            if (string.IsNullOrWhiteSpace(updatedMedicine.Name))
            {
                return BadRequest(new
                {
                    message = "Medicine name is required."
                });
            }

            var medicine = await _context.Medicines
                .FirstOrDefaultAsync(m =>
                    m.MedicineId == id && m.IsActive);

            if (medicine == null)
            {
                return NotFound(new
                {
                    message = "Medicine not found or inactive."
                });
            }

            var medicineName = updatedMedicine.Name.Trim();

            var duplicateExists = await _context.Medicines.AnyAsync(m =>
                m.MedicineId != id &&
                m.IsActive &&
                m.Name.ToLower() == medicineName.ToLower());

            if (duplicateExists)
            {
                return BadRequest(new
                {
                    message = "Another active medicine already uses this name."
                });
            }

            medicine.Name = medicineName;
            medicine.GenericName =
                updatedMedicine.GenericName?.Trim() ?? "";
            medicine.Category =
                updatedMedicine.Category?.Trim() ?? "";
            medicine.Unit =
                updatedMedicine.Unit?.Trim() ?? "";
            medicine.Strength =
                updatedMedicine.Strength?.Trim() ?? "";

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Medicine updated successfully.",
                medicine
            });
        }

        // DELETE: api/Medicine/5
        // Soft delete: preserve batches, sales and report history.
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMedicine(int id)
        {
            try
            {
                var medicine = await _context.Medicines
                    .FirstOrDefaultAsync(m =>
                        m.MedicineId == id && m.IsActive);

                if (medicine == null)
                {
                    return NotFound(new
                    {
                        message = "Medicine not found or already inactive."
                    });
                }

                // Do not physically delete medicine records.
                // Keep stock batches and historical sales intact.
                medicine.IsActive = false;

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Medicine deactivated successfully.",
                    medicineId = medicine.MedicineId,
                    isActive = medicine.IsActive
                });
            }
            catch (DbUpdateException)
            {
                return Conflict(new
                {
                    message = "The medicine could not be deactivated because of a database relationship restriction. Please check its related records."
                });
            }
            catch (Exception)
            {
                return StatusCode(500, new
                {
                    message = "An unexpected error occurred while deactivating the medicine."
                });
            }
        }
    }
}