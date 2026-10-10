using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PharmaTrack.API.Models
{
    [Table("ProductCategory")]
    public class ProductCategory
    {
        [Key]
        public int CategoryId { get; set; }

        [Required]
        [MaxLength(100)]
        public string CategoryName { get; set; } = string.Empty;

        public bool Status { get; set; } = true;

       [System.Text.Json.Serialization.JsonIgnore]
public ICollection<OtherItem> OtherItems { get; set; } = new List<OtherItem>();
    }
}