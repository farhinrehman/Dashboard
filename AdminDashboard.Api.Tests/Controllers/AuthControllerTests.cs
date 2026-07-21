using AdminDashboard.Api.Controllers;
using AdminDashboard.Api.Data;
using AdminDashboard.Api.DTOs;
using AdminDashboard.Api.Models;
using AdminDashboard.Api.Services;
using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;
using Xunit;

namespace AdminDashboard.Api.Tests.Controllers;

public class AuthControllerTests
{
    private static AppDbContext BuildInMemoryDb(string name) =>
        new(new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(name).Options);

    private static IConfiguration BuildConfig() =>
        new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Jwt:RefreshTokenDays"] = "7"
        }).Build();

    private static AuthController BuildController(
        Mock<UserManager<ApplicationUser>> userManager,
        Mock<ITokenService> tokenService,
        AppDbContext db)
        => new(userManager.Object, tokenService.Object, db, BuildConfig());

    [Fact]
    public async Task Register_NewEmail_CreatesUserAndReturnsTokens()
    {
        var userManager = MockUserManagerFactory.Create();
        userManager.Setup(m => m.FindByEmailAsync("new@example.com")).ReturnsAsync((ApplicationUser?)null);
        userManager.Setup(m => m.CreateAsync(It.IsAny<ApplicationUser>(), "Password123"))
            .ReturnsAsync(IdentityResult.Success);
        userManager.Setup(m => m.AddToRoleAsync(It.IsAny<ApplicationUser>(), AppRoles.User))
            .ReturnsAsync(IdentityResult.Success);
        userManager.Setup(m => m.GetRolesAsync(It.IsAny<ApplicationUser>()))
            .ReturnsAsync(new List<string> { AppRoles.User });

        var tokenService = new Mock<ITokenService>();
        tokenService.Setup(t => t.CreateAccessToken(It.IsAny<ApplicationUser>(), It.IsAny<IList<string>>()))
            .Returns(("fake-access-token", DateTime.UtcNow.AddMinutes(30)));
        tokenService.Setup(t => t.CreateRefreshTokenString()).Returns("fake-refresh-token");

        await using var db = BuildInMemoryDb(nameof(Register_NewEmail_CreatesUserAndReturnsTokens));
        var controller = BuildController(userManager, tokenService, db);

        var result = await controller.Register(new RegisterRequest("new@example.com", "Password123", "New", "User"));

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var body = ok.Value.Should().BeOfType<AuthResponse>().Subject;
        body.AccessToken.Should().Be("fake-access-token");
        body.User.Email.Should().Be("new@example.com");
        (await db.RefreshTokens.CountAsync()).Should().Be(1);
    }

    [Fact]
    public async Task Register_ExistingEmail_ReturnsConflict()
    {
        var userManager = MockUserManagerFactory.Create();
        userManager.Setup(m => m.FindByEmailAsync("taken@example.com"))
            .ReturnsAsync(new ApplicationUser { Email = "taken@example.com" });

        var tokenService = new Mock<ITokenService>();
        await using var db = BuildInMemoryDb(nameof(Register_ExistingEmail_ReturnsConflict));
        var controller = BuildController(userManager, tokenService, db);

        var result = await controller.Register(new RegisterRequest("taken@example.com", "Password123", "A", "B"));

        result.Result.Should().BeOfType<ConflictObjectResult>();
    }

    [Fact]
    public async Task Login_ValidCredentials_ReturnsTokens()
    {
        var user = new ApplicationUser { Id = "1", Email = "jane@example.com", IsActive = true };
        var userManager = MockUserManagerFactory.Create();
        userManager.Setup(m => m.FindByEmailAsync("jane@example.com")).ReturnsAsync(user);
        userManager.Setup(m => m.CheckPasswordAsync(user, "Password123")).ReturnsAsync(true);
        userManager.Setup(m => m.UpdateAsync(user)).ReturnsAsync(IdentityResult.Success);
        userManager.Setup(m => m.GetRolesAsync(user)).ReturnsAsync(new List<string> { AppRoles.User });

        var tokenService = new Mock<ITokenService>();
        tokenService.Setup(t => t.CreateAccessToken(user, It.IsAny<IList<string>>()))
            .Returns(("access-token", DateTime.UtcNow.AddMinutes(30)));
        tokenService.Setup(t => t.CreateRefreshTokenString()).Returns("refresh-token");

        await using var db = BuildInMemoryDb(nameof(Login_ValidCredentials_ReturnsTokens));
        var controller = BuildController(userManager, tokenService, db);

        var result = await controller.Login(new LoginRequest("jane@example.com", "Password123"));

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeOfType<AuthResponse>();
    }

    [Fact]
    public async Task Login_WrongPassword_ReturnsUnauthorized()
    {
        var user = new ApplicationUser { Id = "1", Email = "jane@example.com", IsActive = true };
        var userManager = MockUserManagerFactory.Create();
        userManager.Setup(m => m.FindByEmailAsync("jane@example.com")).ReturnsAsync(user);
        userManager.Setup(m => m.CheckPasswordAsync(user, "WrongPassword")).ReturnsAsync(false);

        var tokenService = new Mock<ITokenService>();
        await using var db = BuildInMemoryDb(nameof(Login_WrongPassword_ReturnsUnauthorized));
        var controller = BuildController(userManager, tokenService, db);

        var result = await controller.Login(new LoginRequest("jane@example.com", "WrongPassword"));

        result.Result.Should().BeOfType<UnauthorizedObjectResult>();
    }

    [Fact]
    public async Task Login_InactiveUser_ReturnsUnauthorized()
    {
        var user = new ApplicationUser { Id = "1", Email = "jane@example.com", IsActive = false };
        var userManager = MockUserManagerFactory.Create();
        userManager.Setup(m => m.FindByEmailAsync("jane@example.com")).ReturnsAsync(user);

        var tokenService = new Mock<ITokenService>();
        await using var db = BuildInMemoryDb(nameof(Login_InactiveUser_ReturnsUnauthorized));
        var controller = BuildController(userManager, tokenService, db);

        var result = await controller.Login(new LoginRequest("jane@example.com", "Whatever123"));

        result.Result.Should().BeOfType<UnauthorizedObjectResult>();
    }

    [Fact]
    public async Task Refresh_ValidToken_RevokesOldAndIssuesNew()
    {
        var user = new ApplicationUser { Id = "1", Email = "jane@example.com", IsActive = true };
        await using var db = BuildInMemoryDb(nameof(Refresh_ValidToken_RevokesOldAndIssuesNew));
        db.Users.Add(user);
        db.RefreshTokens.Add(new RefreshToken
        {
            Token = "old-refresh-token",
            UserId = user.Id,
            User = user,
            ExpiresAtUtc = DateTime.UtcNow.AddDays(1)
        });
        await db.SaveChangesAsync();

        var userManager = MockUserManagerFactory.Create();
        userManager.Setup(m => m.GetRolesAsync(It.IsAny<ApplicationUser>()))
            .ReturnsAsync(new List<string> { AppRoles.User });

        var tokenService = new Mock<ITokenService>();
        tokenService.Setup(t => t.CreateAccessToken(It.IsAny<ApplicationUser>(), It.IsAny<IList<string>>()))
            .Returns(("new-access-token", DateTime.UtcNow.AddMinutes(30)));
        tokenService.Setup(t => t.CreateRefreshTokenString()).Returns("new-refresh-token");

        var controller = BuildController(userManager, tokenService, db);

        var result = await controller.Refresh(new RefreshRequest("old-refresh-token"));

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var body = ok.Value.Should().BeOfType<AuthResponse>().Subject;
        body.RefreshToken.Should().Be("new-refresh-token");

        var oldToken = await db.RefreshTokens.FirstAsync(rt => rt.Token == "old-refresh-token");
        oldToken.RevokedAtUtc.Should().NotBeNull();
    }

    [Fact]
    public async Task Refresh_UnknownToken_ReturnsUnauthorized()
    {
        var userManager = MockUserManagerFactory.Create();
        var tokenService = new Mock<ITokenService>();
        await using var db = BuildInMemoryDb(nameof(Refresh_UnknownToken_ReturnsUnauthorized));
        var controller = BuildController(userManager, tokenService, db);

        var result = await controller.Refresh(new RefreshRequest("does-not-exist"));

        result.Result.Should().BeOfType<UnauthorizedObjectResult>();
    }

    [Fact]
    public async Task Refresh_ExpiredToken_ReturnsUnauthorized()
    {
        var user = new ApplicationUser { Id = "1", Email = "jane@example.com" };
        await using var db = BuildInMemoryDb(nameof(Refresh_ExpiredToken_ReturnsUnauthorized));
        db.Users.Add(user);
        db.RefreshTokens.Add(new RefreshToken
        {
            Token = "expired-token",
            UserId = user.Id,
            User = user,
            ExpiresAtUtc = DateTime.UtcNow.AddDays(-1)
        });
        await db.SaveChangesAsync();

        var userManager = MockUserManagerFactory.Create();
        var tokenService = new Mock<ITokenService>();
        var controller = BuildController(userManager, tokenService, db);

        var result = await controller.Refresh(new RefreshRequest("expired-token"));

        result.Result.Should().BeOfType<UnauthorizedObjectResult>();
    }
}
