using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PharmaTrack.API.Data;
using PharmaTrack.API.Models;

namespace PharmaTrack.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SupplierController : ControllerBase
    {
        private readonly PharmaTrackDbContext _context;

        public SupplierController(PharmaTrackDbContext context)
        {
            _context = context;
        }

        // ==========================================
        // GET ALL SUPPLIERS
        // ==========================================
        [HttpGet]
        public async Task<IActionResult> GetSuppliers()
        {
            var suppliers = await _context.Suppliers
                .AsNoTracking()
                .ToListAsync();

            return Ok(suppliers);
        }

        // ==========================================
        // CREATE SUPPLIER
        // ==========================================
        [HttpPost]
        public async Task<IActionResult> CreateSupplier(
            [FromBody] Supplier supplier)
        {
            if (supplier == null)
            {
                return BadRequest(new
                {
                    message = "Supplier data is required."
                });
            }

            if (string.IsNullOrWhiteSpace(supplier.SupplierName))
            {
                return BadRequest(new
                {
                    message = "Supplier name is required."
                });
            }

            _context.Suppliers.Add(supplier);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Supplier created successfully.",
                supplierId = supplier.SupplierId,
                supplierName = supplier.SupplierName,
                contactNumber = supplier.ContactNumber,
                email = supplier.Email,
                address = supplier.Address
            });
        }

        // ==========================================
        // UPDATE SUPPLIER
        // ==========================================
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateSupplier(
            int id,
            [FromBody] Supplier updatedSupplier)
        {
            if (updatedSupplier == null)
            {
                return BadRequest(new
                {
                    message = "Supplier data is required."
                });
            }

            var supplier = await _context.Suppliers.FindAsync(id);

            if (supplier == null)
            {
                return NotFound(new
                {
                    message = "Supplier not found."
                });
            }

            if (string.IsNullOrWhiteSpace(updatedSupplier.SupplierName))
            {
                return BadRequest(new
                {
                    message = "Supplier name is required."
                });
            }

            supplier.SupplierName = updatedSupplier.SupplierName;
            supplier.ContactNumber = updatedSupplier.ContactNumber;
            supplier.Email = updatedSupplier.Email;
            supplier.Address = updatedSupplier.Address;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Supplier updated successfully.",
                supplierId = supplier.SupplierId,
                supplierName = supplier.SupplierName,
                contactNumber = supplier.ContactNumber,
                email = supplier.Email,
                address = supplier.Address
            });
        }

        // ==========================================
        // DELETE SUPPLIER
        // ==========================================
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSupplier(int id)
        {
            var supplier = await _context.Suppliers.FindAsync(id);

            if (supplier == null)
            {
                return NotFound(new
                {
                    message = "Supplier not found."
                });
            }

            // Supplier can be deleted even if it was used
            // by medicine batches.
            //
            // Because SupplierId is nullable and the FK uses
            // DeleteBehavior.SetNull, related batches will remain
            // and their SupplierId will become NULL.

            _context.Suppliers.Remove(supplier);

            try
            {
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Supplier deleted successfully. Existing medicine batches were preserved.",
                    supplierId = id
                });
            }
            catch (DbUpdateException)
            {
                return Conflict(new
                {
                    message = "Supplier could not be deleted because it is still referenced by another record."
                });
            }
        }
    }
}