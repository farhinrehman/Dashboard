using AdminDashboard.Api.DTOs;
using AdminDashboard.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace AdminDashboard.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;

    public DashboardController(UserManager<ApplicationUser> userManager)
    {
        _userManager = userManager;
    }

    /// <summary>Returns aggregate stats for the dashboard's summary cards. Any authenticated user.</summary>
    [HttpGet("summary")]
    public async Task<ActionResult<DashboardSummary>> GetSummary()
    {
        var users = _userManager.Users.ToList();
        var sevenDaysAgo = DateTime.UtcNow.AddDays(-7);

        var adminCount = 0;
        foreach (var user in users)
        {
            if (await _userManager.IsInRoleAsync(user, AppRoles.Admin))
            {
                adminCount++;
            }
        }

        var summary = new DashboardSummary(
            TotalUsers: users.Count,
            ActiveUsers: users.Count(u => u.IsActive),
            AdminCount: adminCount,
            NewUsersLast7Days: users.Count(u => u.CreatedAtUtc >= sevenDaysAgo)
        );

        return Ok(summary);
    }

    /// <summary>Returns the profile of the currently authenticated user.</summary>
    [HttpGet("me")]
    public async Task<ActionResult<UserSummary>> GetMe()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userId is null) return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user is null) return NotFound();

        var roles = await _userManager.GetRolesAsync(user);
        return Ok(new UserSummary(user.Id, user.Email ?? "", user.FirstName, user.LastName, roles.ToList()));
    }
}
