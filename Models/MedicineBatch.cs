using System.ComponentModel.DataAnnotations;

namespace PharmacyAPI.Models
{
    public class MedicineBatch
    {
        [Key]
        public int BatchId { get; set; }

        public int MedicineId { get; set; }

        public int SupplierId { get; set; }

        public string BatchName { get; set; } = string.Empty;

        public DateTime ManufacturingDate { get; set; }

        public DateTime ExpiryDate { get; set; }

        public decimal PurchasePrice { get; set; }

        public decimal SellingPrice { get; set; }

        public int Quantity { get; set; }
    }
}