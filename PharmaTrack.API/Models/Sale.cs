using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PharmaTrack.API.Models
{
    [Table("Sale")]
    public class Sale
    {
        [Key]
        public int SaleId { get; set; }

        public int UserId { get; set; }

        public DateTime SaleDate { get; set; }

        public decimal TotalAmount { get; set; }

        public string PaymentMethod { get; set; } = string.Empty;
    }
}