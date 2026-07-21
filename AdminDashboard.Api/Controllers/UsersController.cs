using AdminDashboard.Api.DTOs;
using AdminDashboard.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace AdminDashboard.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = AppRoles.Admin)]
public class UsersController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;

    public UsersController(UserManager<ApplicationUser> userManager)
    {
        _userManager = userManager;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserListItem>>> GetAll()
    {
        var users = _userManager.Users.ToList();
        var result = new List<UserListItem>();

        foreach (var user in users)
        {
            var roles = await _userManager.GetRolesAsync(user);
            result.Add(new UserListItem(
                user.Id, user.Email ?? "", user.FirstName, user.LastName,
                user.IsActive, roles.ToList(), user.CreatedAtUtc, user.LastLoginUtc));
        }

        return Ok(result.OrderByDescending(u => u.CreatedAtUtc));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<UserListItem>> GetById(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user is null) return NotFound();

        var roles = await _userManager.GetRolesAsync(user);
        return Ok(new UserListItem(
            user.Id, user.Email ?? "", user.FirstName, user.LastName,
            user.IsActive, roles.ToList(), user.CreatedAtUtc, user.LastLoginUtc));
    }

    [HttpPost]
    public async Task<ActionResult<UserListItem>> Create(CreateUserRequest request)
    {
        if (!AppRoles.All.Contains(request.Role))
        {
            return BadRequest(new { message = $"Role must be one of: {string.Join(", ", AppRoles.All)}" });
        }

        var existing = await _userManager.FindByEmailAsync(request.Email);
        if (existing is not null)
        {
            return Conflict(new { message = "A user with this email already exists." });
        }

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            FirstName = request.FirstName,
            LastName = request.LastName,
            EmailConfirmed = true,
            IsActive = true
        };

        var createResult = await _userManager.CreateAsync(user, request.Password);
        if (!createResult.Succeeded)
        {
            return BadRequest(new { errors = createResult.Errors.Select(e => e.Description) });
        }

        await _userManager.AddToRoleAsync(user, request.Role);

        return CreatedAtAction(nameof(GetById), new { id = user.Id }, new UserListItem(
            user.Id, user.Email, user.FirstName, user.LastName,
            user.IsActive, new[] { request.Role }, user.CreatedAtUtc, user.LastLoginUtc));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<UserListItem>> Update(string id, UpdateUserRequest request)
    {
        if (!AppRoles.All.Contains(request.Role))
        {
            return BadRequest(new { message = $"Role must be one of: {string.Join(", ", AppRoles.All)}" });
        }

        var user = await _userManager.FindByIdAsync(id);
        if (user is null) return NotFound();

        user.FirstName = request.FirstName;
        user.LastName = request.LastName;
        user.IsActive = request.IsActive;
        await _userManager.UpdateAsync(user);

        var currentRoles = await _userManager.GetRolesAsync(user);
        if (!currentRoles.Contains(request.Role))
        {
            await _userManager.RemoveFromRolesAsync(user, currentRoles);
            await _userManager.AddToRoleAsync(user, request.Role);
        }

        return Ok(new UserListItem(
            user.Id, user.Email ?? "", user.FirstName, user.LastName,
            user.IsActive, new[] { request.Role }, user.CreatedAtUtc, user.LastLoginUtc));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (currentUserId == id)
        {
            return BadRequest(new { message = "You cannot delete your own account." });
        }

        var user = await _userManager.FindByIdAsync(id);
        if (user is null) return NotFound();

        await _userManager.DeleteAsync(user);
        return NoContent();
    }
}