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

        [HttpGet]
        public async Task<IActionResult> GetMedicines()
        {
            var medicines = await _context.Medicines.ToListAsync();

            return Ok(medicines);
        }

        [HttpPost]
        public async Task<IActionResult> CreateMedicine([FromBody] Medicine medicine)
        {
            _context.Medicines.Add(medicine);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Medicine created successfully.",
                medicineId = medicine.MedicineId,
                name = medicine.Name,
                genericName = medicine.GenericName,
                category = medicine.Category,
                unit = medicine.Unit,
                strength = medicine.Strength
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateMedicine(
            int id,
            [FromBody] Medicine updatedMedicine)
        {
            var medicine = await _context.Medicines.FindAsync(id);

            if (medicine == null)
            {
                return NotFound(new
                {
                    message = "Medicine not found."
                });
            }

            medicine.Name = updatedMedicine.Name;
            medicine.GenericName = updatedMedicine.GenericName;
            medicine.Category = updatedMedicine.Category;
            medicine.Unit = updatedMedicine.Unit;
            medicine.Strength = updatedMedicine.Strength;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Medicine updated successfully.",
                medicineId = medicine.MedicineId,
                name = medicine.Name,
                genericName = medicine.GenericName,
                category = medicine.Category,
                unit = medicine.Unit,
                strength = medicine.Strength
            });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMedicine(int id)
        {
            var medicine = await _context.Medicines.FindAsync(id);

            if (medicine == null)
            {
                return NotFound(new
                {
                    message = "Medicine not found."
                });
            }

            _context.Medicines.Remove(medicine);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Medicine deleted successfully.",
                medicineId = id
            });
        }
    }
}