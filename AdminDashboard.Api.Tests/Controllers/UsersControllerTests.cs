using System.Security.Claims;
using AdminDashboard.Api.Controllers;
using AdminDashboard.Api.DTOs;
using AdminDashboard.Api.Models;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace AdminDashboard.Api.Tests.Controllers;

public class UsersControllerTests
{
    private static UsersController BuildController(Mock<UserManager<ApplicationUser>> userManager, string callerId = "admin-1")
    {
        var controller = new UsersController(userManager.Object);
        var identity = new ClaimsIdentity(new[] { new Claim(ClaimTypes.NameIdentifier, callerId) }, "Test");
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
        };
        return controller;
    }

    [Fact]
    public async Task Create_ValidRole_CreatesUserAndAssignsRole()
    {
        var userManager = MockUserManagerFactory.Create();
        userManager.Setup(m => m.FindByEmailAsync("new@example.com")).ReturnsAsync((ApplicationUser?)null);
        userManager.Setup(m => m.CreateAsync(It.IsAny<ApplicationUser>(), "Password123"))
            .ReturnsAsync(IdentityResult.Success);
        userManager.Setup(m => m.AddToRoleAsync(It.IsAny<ApplicationUser>(), AppRoles.Admin))
            .ReturnsAsync(IdentityResult.Success);

        var controller = BuildController(userManager);

        var result = await controller.Create(new CreateUserRequest("new@example.com", "Password123", "New", "User", AppRoles.Admin));

        var created = result.Result.Should().BeOfType<CreatedAtActionResult>().Subject;
        var body = created.Value.Should().BeOfType<UserListItem>().Subject;
        body.Roles.Should().Contain(AppRoles.Admin);
        userManager.Verify(m => m.AddToRoleAsync(It.IsAny<ApplicationUser>(), AppRoles.Admin), Times.Once);
    }

    [Fact]
    public async Task Create_InvalidRole_ReturnsBadRequest()
    {
        var userManager = MockUserManagerFactory.Create();
        var controller = BuildController(userManager);

        var result = await controller.Create(new CreateUserRequest("x@example.com", "Password123", "A", "B", "SuperUser"));

        result.Result.Should().BeOfType<BadRequestObjectResult>();
        userManager.Verify(m => m.CreateAsync(It.IsAny<ApplicationUser>(), It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task Create_DuplicateEmail_ReturnsConflict()
    {
        var userManager = MockUserManagerFactory.Create();
        userManager.Setup(m => m.FindByEmailAsync("dup@example.com"))
            .ReturnsAsync(new ApplicationUser { Email = "dup@example.com" });
        var controller = BuildController(userManager);

        var result = await controller.Create(new CreateUserRequest("dup@example.com", "Password123", "A", "B", AppRoles.User));

        result.Result.Should().BeOfType<ConflictObjectResult>();
    }

    [Fact]
    public async Task Delete_OwnAccount_ReturnsBadRequest()
    {
        var userManager = MockUserManagerFactory.Create();
        var controller = BuildController(userManager, callerId: "admin-1");

        var result = await controller.Delete("admin-1");

        result.Should().BeOfType<BadRequestObjectResult>();
        userManager.Verify(m => m.DeleteAsync(It.IsAny<ApplicationUser>()), Times.Never);
    }

    [Fact]
    public async Task Delete_OtherUser_DeletesSuccessfully()
    {
        var target = new ApplicationUser { Id = "user-2", Email = "target@example.com" };
        var userManager = MockUserManagerFactory.Create();
        userManager.Setup(m => m.FindByIdAsync("user-2")).ReturnsAsync(target);
        userManager.Setup(m => m.DeleteAsync(target)).ReturnsAsync(IdentityResult.Success);

        var controller = BuildController(userManager, callerId: "admin-1");

        var result = await controller.Delete("user-2");

        result.Should().BeOfType<NoContentResult>();
        userManager.Verify(m => m.DeleteAsync(target), Times.Once);
    }

    [Fact]
    public async Task Delete_UnknownUser_ReturnsNotFound()
    {
        var userManager = MockUserManagerFactory.Create();
        userManager.Setup(m => m.FindByIdAsync("missing")).ReturnsAsync((ApplicationUser?)null);
        var controller = BuildController(userManager);

        var result = await controller.Delete("missing");

        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task Update_ChangesRoleWhenDifferent()
    {
        var user = new ApplicationUser { Id = "user-3", FirstName = "Old", LastName = "Name" };
        var userManager = MockUserManagerFactory.Create();
        userManager.Setup(m => m.FindByIdAsync("user-3")).ReturnsAsync(user);
        userManager.Setup(m => m.UpdateAsync(user)).ReturnsAsync(IdentityResult.Success);
        userManager.Setup(m => m.GetRolesAsync(user)).ReturnsAsync(new List<string> { AppRoles.User });
        userManager.Setup(m => m.RemoveFromRolesAsync(user, It.IsAny<IEnumerable<string>>()))
            .ReturnsAsync(IdentityResult.Success);
        userManager.Setup(m => m.AddToRoleAsync(user, AppRoles.Admin)).ReturnsAsync(IdentityResult.Success);

        var controller = BuildController(userManager);

        var result = await controller.Update("user-3", new UpdateUserRequest("New", "Name", AppRoles.Admin, true));

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var body = ok.Value.Should().BeOfType<UserListItem>().Subject;
        body.Roles.Should().Contain(AppRoles.Admin);
        userManager.Verify(m => m.AddToRoleAsync(user, AppRoles.Admin), Times.Once);
    }
}
