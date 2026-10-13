
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PharmaTrack.API.Models
{
    [Table("PasswordResetToken")]
    public class PasswordResetToken
    {
        [Key]
        public int PasswordResetTokenId { get; set; }

        public int UserId { get; set; }

[ForeignKey(nameof(UserId))]
public User User { get; set; } = null!;
        [Required]
        [MaxLength(64)]
        public string TokenHash { get; set; } = string.Empty;

        public DateTime ExpiresAt { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime? UsedAt { get; set; }
    }
}
