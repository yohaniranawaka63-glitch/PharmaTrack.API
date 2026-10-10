using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PharmaTrack.API.Models
{
    [Table("OtherItem")]
    public class OtherItem
    {
        [Key]
        public int OtherItemId { get; set; }

        [Required]
        public string ItemName { get; set; } = string.Empty;

        public string? Category { get; set; }

        public string? Unit { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal PurchasePrice { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal SellingPrice { get; set; }

        public int Quantity { get; set; }

        public int ReorderLevel { get; set; }

        public bool Status { get; set; } = true;

        // Product Category relationship
        public int? ProductCategoryId { get; set; }

        [ForeignKey("ProductCategoryId")]
        public ProductCategory? ProductCategory { get; set; }
    }
}