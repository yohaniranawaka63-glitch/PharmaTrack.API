
using Microsoft.EntityFrameworkCore;
using PharmaTrack.API.Models;

namespace PharmaTrack.API.Data
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

        public DbSet<SaleItem> SaleItem { get; set; }

        public DbSet<StockTransaction> StockTransactions { get; set; }

        public DbSet<Role> Roles { get; set; }

        public DbSet<User> Users { get; set; }

        public DbSet<OtherItem> OtherItems { get; set; }

        public DbSet<ProductCategory> ProductCategories { get; set; }

        public DbSet<SupportRequest> SupportRequests { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ==========================================
            // SUPPLIER -> MEDICINE BATCH
            // ==========================================
            modelBuilder.Entity<MedicineBatch>()
                .HasOne<Supplier>()
                .WithMany()
                .HasForeignKey(batch => batch.SupplierId)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }
}
