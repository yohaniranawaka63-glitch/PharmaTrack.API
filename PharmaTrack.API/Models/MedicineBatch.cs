using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PharmaTrack.API.Models
{
    [Table("MedicineBatch")]
    public class MedicineBatch
    {
        [Key]
        public int BatchId { get; set; }

        public int MedicineId { get; set; }

        // Supplier can be deleted without deleting the batch
        public int? SupplierId { get; set; }

        public string BatchName { get; set; } = string.Empty;

        public DateTime ManufacturingDate { get; set; }

        public DateTime ExpiryDate { get; set; }

        public decimal PurchasePrice { get; set; }

        public decimal SellingPrice { get; set; }

        public int Quantity { get; set; }

        // Active / Inactive batch
        public bool IsActive { get; set; } = true;
    }
}