using AdminDashboard.Api.Models;
using Microsoft.AspNetCore.Identity;
using Moq;

namespace AdminDashboard.Api.Tests;

/// <summary>
/// UserManager&lt;T&gt; has no interface, so real unit tests mock its underlying
/// IUserStore and construct the manager around that mock. This helper centralizes
/// that boilerplate for every controller test that depends on UserManager.
/// </summary>
public static class MockUserManagerFactory
{
    public static Mock<UserManager<ApplicationUser>> Create()
    {
        var store = new Mock<IUserStore<ApplicationUser>>();
        var mgr = new Mock<UserManager<ApplicationUser>>(
            store.Object, null!, null!, null!, null!, null!, null!, null!, null!);
        return mgr;
    }
}
