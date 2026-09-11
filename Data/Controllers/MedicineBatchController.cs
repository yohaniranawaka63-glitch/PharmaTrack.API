using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PharmacyAPI.Data;
using PharmacyAPI.Models;

namespace PharmacyAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MedicineBatchController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MedicineBatchController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<MedicineBatch>>> GetMedicineBatches()
        {
            return await _context.MedicineBatches.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<MedicineBatch>> GetMedicineBatch(int id)
        {
            var batch = await _context.MedicineBatches.FindAsync(id);

            if (batch == null)
            {
                return NotFound();
            }

            return batch;
        }

        [HttpPost]
        public async Task<ActionResult<MedicineBatch>> CreateMedicineBatch(
            MedicineBatch batch)
        {
            _context.MedicineBatches.Add(batch);
            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetMedicineBatch),
                new { id = batch.BatchId },
                batch
            );
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateMedicineBatch(
            int id,
            MedicineBatch batch)
        {
            if (id != batch.BatchId)
            {
                return BadRequest();
            }

            _context.Entry(batch).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!MedicineBatchExists(id))
                {
                    return NotFound();
                }

                throw;
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMedicineBatch(int id)
        {
            var batch = await _context.MedicineBatches.FindAsync(id);

            if (batch == null)
            {
                return NotFound();
            }

            _context.MedicineBatches.Remove(batch);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool MedicineBatchExists(int id)
        {
            return _context.MedicineBatches.Any(e => e.BatchId == id);
        }
    }
}