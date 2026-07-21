using System.ComponentModel.DataAnnotations;

namespace AdminDashboard.Api.DTOs;

public record UserListItem(
    string Id,
    string Email,
    string FirstName,
    string LastName,
    bool IsActive,
    IReadOnlyList<string> Roles,
    DateTime CreatedAtUtc,
    DateTime? LastLoginUtc
);

public record CreateUserRequest(
    [Required, EmailAddress] string Email,
    [Required, MinLength(8)] string Password,
    [Required] string FirstName,
    [Required] string LastName,
    [Required] string Role
);

public record UpdateUserRequest(
    [Required] string FirstName,
    [Required] string LastName,
    [Required] string Role,
    bool IsActive
);

public record DashboardSummary(
    int TotalUsers,
    int ActiveUsers,
    int AdminCount,
    int NewUsersLast7Days
);
