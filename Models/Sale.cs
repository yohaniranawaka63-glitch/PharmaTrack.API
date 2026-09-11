namespace PharmacyAPI.Models
{
    public class Sale
    {
        public int SaleId { get; set; }

        public int UserId { get; set; }

        public DateTime SaleDate { get; set; }

        public decimal TotalAmount { get; set; }

        public string PaymentMethod { get; set; } = string.Empty;
    }
}