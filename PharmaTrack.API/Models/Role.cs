using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PharmaTrack.API.Models
{
    [Table("Role")]
    public class Role
    {
        [Key]
        public int RoleId { get; set; }

        public string RoleName { get; set; } = string.Empty;
    }
}