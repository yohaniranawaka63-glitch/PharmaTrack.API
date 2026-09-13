using Microsoft.EntityFrameworkCore;
using PharmacyAPI.Models;

namespace PharmacyAPI.Data
{
    public class PharmaTrackDbContext : DbContext
    {
        public PharmaTrackDbContext(DbContextOptions<PharmaTrackDbContext> options)
            : base(options)
        {
        }

        public DbSet<Medicine> Medicines { get; set; }
        public DbSet<Supplier> Suppliers { get; set; }
        public DbSet<MedicineBatch> MedicineBatches { get; set; }
        public DbSet<Sale> Sales { get; set; }
        public DbSet<SaleItem> SaleItems { get; set; }
        public DbSet<StockTransaction> StockTransactions { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<User> Users { get; set; }
    }
}