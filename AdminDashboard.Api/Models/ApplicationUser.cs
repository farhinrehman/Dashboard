using Microsoft.AspNetCore.Identity;

namespace AdminDashboard.Api.Models;

/// <summary>
/// Application user, extending ASP.NET Core Identity's base user with
/// the extra profile fields the admin dashboard needs.
/// </summary>
public class ApplicationUser : IdentityUser
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginUtc { get; set; }

    // Navigation property for issued refresh tokens.
    public List<RefreshToken> RefreshTokens { get; set; } = new();
}
