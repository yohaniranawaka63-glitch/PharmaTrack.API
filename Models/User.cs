using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PharmacyAPI.Models
{
    [Table("User")]
    public class User
    {
        [Key]
        public int UserId { get; set; }

        public string Name { get; set; }

        public string UserName { get; set; }

        public string Password { get; set; }

        public int RoleId { get; set; }

        public Role Role { get; set; }

        public bool Status { get; set; }
    }
}