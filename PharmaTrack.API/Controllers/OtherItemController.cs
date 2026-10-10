
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PharmaTrack.API.Data;
using PharmaTrack.API.Models;

namespace PharmaTrack.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OtherItemController : ControllerBase
    {
        private readonly PharmaTrackDbContext _context;

        public OtherItemController(PharmaTrackDbContext context)
        {
            _context = context;
        }

        // GET: api/OtherItem
        // Get active items for the Stock page
        [HttpGet]
        public async Task<ActionResult<IEnumerable<OtherItem>>> GetOtherItems()
        {
            var items = await _context.OtherItems
                .AsNoTracking()
                .Include(i => i.ProductCategory)
                .Where(i => i.Status == true)
                .OrderBy(i => i.ItemName)
                .ToListAsync();

            return Ok(items);
        }

        // GET: api/OtherItem/5
        // Get one active item
        [HttpGet("{id}")]
        public async Task<ActionResult<OtherItem>> GetOtherItem(int id)
        {
            var item = await _context.OtherItems
                .AsNoTracking()
                .Include(i => i.ProductCategory)
                .FirstOrDefaultAsync(i =>
                    i.OtherItemId == id &&
                    i.Status == true);

            if (item == null)
            {
                return NotFound(new
                {
                    message = "Other item not found."
                });
            }

            return Ok(item);
        }

        // GET: api/OtherItem/5/CostDetails
        // Get cost details for historical sales,
        // including inactive items
        [HttpGet("{id}/CostDetails")]
        public async Task<IActionResult> GetOtherItemCostDetails(int id)
        {
            var item = await _context.OtherItems
                .AsNoTracking()
                .Where(i => i.OtherItemId == id)
                .Select(i => new
                {
                    i.OtherItemId,
                    i.ItemName,
                    i.PurchasePrice,
                    i.SellingPrice,
                    i.Status
                })
                .FirstOrDefaultAsync();

            if (item == null)
            {
                return NotFound(new
                {
                    message = "Other item not found."
                });
            }

            return Ok(item);
        }

        // POST: api/OtherItem
        [HttpPost]
        public async Task<ActionResult<OtherItem>> PostOtherItem(
            [FromBody] OtherItem item)
        {
            if (item == null)
            {
                return BadRequest(new
                {
                    message = "Invalid item data."
                });
            }

            var categoryExists = await _context.ProductCategories
                .AnyAsync(c => c.CategoryId == item.ProductCategoryId);

            if (!categoryExists)
            {
                return BadRequest(new
                {
                    message = "Invalid ProductCategoryId."
                });
            }

            item.Status = true;

            _context.OtherItems.Add(item);
            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetOtherItem),
                new { id = item.OtherItemId },
                item
            );
        }

        // PUT: api/OtherItem/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutOtherItem(
            int id,
            [FromBody] OtherItem item)
        {
            if (item == null)
            {
                return BadRequest(new
                {
                    message = "Invalid item data."
                });
            }

            if (id != item.OtherItemId)
            {
                return BadRequest(new
                {
                    message = "ID mismatch."
                });
            }

            var existingItem = await _context.OtherItems
                .FirstOrDefaultAsync(i =>
                    i.OtherItemId == id &&
                    i.Status == true);

            if (existingItem == null)
            {
                return NotFound(new
                {
                    message = "Other item not found."
                });
            }

            var categoryExists = await _context.ProductCategories
                .AnyAsync(c => c.CategoryId == item.ProductCategoryId);

            if (!categoryExists)
            {
                return BadRequest(new
                {
                    message = "Invalid ProductCategoryId."
                });
            }

            existingItem.ItemName = item.ItemName;
            existingItem.ProductCategoryId = item.ProductCategoryId;
            existingItem.Category = item.Category;
            existingItem.Unit = item.Unit;
            existingItem.PurchasePrice = item.PurchasePrice;
            existingItem.SellingPrice = item.SellingPrice;
            existingItem.Quantity = item.Quantity;
            existingItem.ReorderLevel = item.ReorderLevel;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Other item updated successfully.",
                otherItemId = existingItem.OtherItemId,
                itemName = existingItem.ItemName
            });
        }

        // DELETE: api/OtherItem/5
        // Soft delete - preserve historical sales references
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteOtherItem(int id)
        {
            var item = await _context.OtherItems
                .FirstOrDefaultAsync(i => i.OtherItemId == id);

            if (item == null || !item.Status)
            {
                return NotFound(new
                {
                    message = "Other item not found."
                });
            }

            item.Status = false;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Other item deleted successfully.",
                otherItemId = id
            });
        }

        private bool OtherItemExists(int id)
        {
            return _context.OtherItems
                .Any(e => e.OtherItemId == id);
        }
    }
}
