using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PharmaTrack.API.Models
{
    [Table("StockTransaction")]
    public class StockTransaction
    {
        [Key]
        public int TransactionId { get; set; }

        public int BatchId { get; set; }

        public int UserId { get; set; }

        public string TransactionType { get; set; } = string.Empty;

        public int Quantity { get; set; }

        public DateTime TransactionDate { get; set; }

        public string Note { get; set; } = string.Empty;
    }
}