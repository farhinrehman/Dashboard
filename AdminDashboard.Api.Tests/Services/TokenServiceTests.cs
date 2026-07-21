using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using AdminDashboard.Api.Models;
using AdminDashboard.Api.Services;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace AdminDashboard.Api.Tests.Services;

public class TokenServiceTests
{
    private static IConfiguration BuildConfig(int accessMinutes = 30)
    {
        var settings = new Dictionary<string, string?>
        {
            ["Jwt:Issuer"] = "TestIssuer",
            ["Jwt:Audience"] = "TestAudience",
            ["Jwt:Key"] = "unit-test-signing-key-must-be-at-least-32-chars-long",
            ["Jwt:AccessTokenMinutes"] = accessMinutes.ToString(),
            ["Jwt:RefreshTokenDays"] = "7"
        };

        return new ConfigurationBuilder().AddInMemoryCollection(settings).Build();
    }

    private static ApplicationUser BuildUser() => new()
    {
        Id = "user-123",
        Email = "jane.doe@example.com",
        FirstName = "Jane",
        LastName = "Doe"
    };

    [Fact]
    public void CreateAccessToken_ProducesTokenWithExpectedClaims()
    {
        var service = new TokenService(BuildConfig());
        var user = BuildUser();

        var (token, expiresAtUtc) = service.CreateAccessToken(user, new List<string> { AppRoles.Admin });

        token.Should().NotBeNullOrWhiteSpace();
        expiresAtUtc.Should().BeAfter(DateTime.UtcNow);

        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(token);

        jwt.Issuer.Should().Be("TestIssuer");
        jwt.Audiences.Should().Contain("TestAudience");
        jwt.Claims.Should().Contain(c => c.Type == JwtRegisteredClaimNames.Sub && c.Value == user.Id);
        jwt.Claims.Should().Contain(c => c.Type == JwtRegisteredClaimNames.Email && c.Value == user.Email);
        jwt.Claims.Should().Contain(c => c.Type == ClaimTypes.Role && c.Value == AppRoles.Admin);
    }

    [Fact]
    public void CreateAccessToken_IncludesAllProvidedRoles()
    {
        var service = new TokenService(BuildConfig());
        var user = BuildUser();

        var (token, _) = service.CreateAccessToken(user, new List<string> { AppRoles.Admin, AppRoles.User });

        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(token);
        var roleClaims = jwt.Claims.Where(c => c.Type == ClaimTypes.Role).Select(c => c.Value).ToList();

        roleClaims.Should().BeEquivalentTo(new[] { AppRoles.Admin, AppRoles.User });
    }

    [Fact]
    public void CreateAccessToken_RespectsConfiguredExpiryWindow()
    {
        var service = new TokenService(BuildConfig(accessMinutes: 5));
        var user = BuildUser();

        var (_, expiresAtUtc) = service.CreateAccessToken(user, new List<string>());

        expiresAtUtc.Should().BeCloseTo(DateTime.UtcNow.AddMinutes(5), TimeSpan.FromSeconds(5));
    }

    [Fact]
    public void CreateAccessToken_MissingKey_ThrowsInvalidOperationException()
    {
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>()).Build();
        var service = new TokenService(config);
        var user = BuildUser();

        Action act = () => service.CreateAccessToken(user, new List<string>());

        act.Should().Throw<InvalidOperationException>();
    }

    [Fact]
    public void CreateRefreshTokenString_ReturnsUniqueValuesEachCall()
    {
        var service = new TokenService(BuildConfig());

        var first = service.CreateRefreshTokenString();
        var second = service.CreateRefreshTokenString();

        first.Should().NotBeNullOrWhiteSpace();
        second.Should().NotBeNullOrWhiteSpace();
        first.Should().NotBe(second);
    }
}
