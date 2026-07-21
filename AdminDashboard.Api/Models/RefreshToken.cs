namespace AdminDashboard.Api.Models;

/// <summary>
/// A refresh token issued to a user so they can obtain a new access token
/// without re-entering credentials. Stored server-side so tokens can be revoked.
/// </summary>
public class RefreshToken
{
    public int Id { get; set; }
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAtUtc { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? RevokedAtUtc { get; set; }
    public bool IsActive => RevokedAtUtc is null && DateTime.UtcNow < ExpiresAtUtc;

    public string UserId { get; set; } = string.Empty;
    public ApplicationUser? User { get; set; }
}
