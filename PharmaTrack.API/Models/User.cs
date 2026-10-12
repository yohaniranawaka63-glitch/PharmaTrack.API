
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PharmaTrack.API.Models
{
    [Table("User")]
    public class User
    {
        [Key]
        public int UserId { get; set; }

        public string Name { get; set; } = string.Empty;

        public string UserName { get; set; } = string.Empty;

        public string Password { get; set; } = string.Empty;

        [EmailAddress]
        public string? Email { get; set; }

        public int RoleId { get; set; }

        public bool Status { get; set; }
    }
}
