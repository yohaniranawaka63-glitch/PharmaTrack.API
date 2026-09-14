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

        [HttpGet]
        public async Task<IActionResult> GetSuppliers()
        {
            var suppliers = await _context.Suppliers.ToListAsync();

            return Ok(suppliers);
        }

        [HttpPost]
        public async Task<IActionResult> CreateSupplier(
            [FromBody] Supplier supplier)
        {
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

        [HttpPut("{id}")]
public async Task<IActionResult> UpdateSupplier(
    int id,
    [FromBody] Supplier updatedSupplier)
{
    var supplier = await _context.Suppliers.FindAsync(id);

    if (supplier == null)
    {
        return NotFound(new
        {
            message = "Supplier not found."
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

            _context.Suppliers.Remove(supplier);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Supplier deleted successfully.",
                supplierId = id
            });
        }
    }
}