using System.ComponentModel.DataAnnotations;

namespace AdminDashboard.Api.DTOs;

public record RegisterRequest(
    [Required, EmailAddress] string Email,
    [Required, MinLength(8)] string Password,
    [Required] string FirstName,
    [Required] string LastName
);

public record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required] string Password
);

public record RefreshRequest(
    [Required] string RefreshToken
);

public record AuthResponse(
    string AccessToken,
    string RefreshToken,
    DateTime AccessTokenExpiresAtUtc,
    UserSummary User
);

public record UserSummary(
    string Id,
    string Email,
    string FirstName,
    string LastName,
    IReadOnlyList<string> Roles
);
