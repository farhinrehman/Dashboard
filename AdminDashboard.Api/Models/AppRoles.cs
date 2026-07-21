namespace AdminDashboard.Api.Models;

/// <summary>Well-known role names used for authorization checks throughout the API.</summary>
public static class AppRoles
{
    public const string Admin = "Admin";
    public const string User = "User";

    public static readonly string[] All = { Admin, User };
}
