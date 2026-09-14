using System.ComponentModel.DataAnnotations;

namespace PharmacyAPI.Models
{
    public class Role
    {
        [Key]
        public int RoleId { get; set; }

        public string RoleName { get; set; } = string.Empty;

        public ICollection<User> Users { get; set; } = new List<User>();
    }
}