namespace PharmacyAPI.Models
{
    public class Medicine
    {
        public int MedicineId { get; set; }

        public string MedicineName { get; set; } = string.Empty;

        public string Category { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;
    }
}