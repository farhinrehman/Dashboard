using AdminDashboard.Api.Models;

namespace AdminDashboard.Api.Services;

public interface ITokenService
{
    /// <summary>Creates a signed JWT access token for the given user and roles.</summary>
    (string Token, DateTime ExpiresAtUtc) CreateAccessToken(ApplicationUser user, IList<string> roles);

    /// <summary>Creates a cryptographically random refresh token string.</summary>
    string CreateRefreshTokenString();
}
