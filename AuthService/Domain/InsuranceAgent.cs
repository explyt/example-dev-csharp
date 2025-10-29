using System.Collections.Generic;

namespace AuthService.Domain;

public class InsuranceAgent
{
    // EF Core requires a parameterless constructor
    private InsuranceAgent()
    {
    }

    public InsuranceAgent(string login, string password, string avatar, List<string> availableProducts)
    {
        Login = login;
        Password = password;
        Avatar = avatar;
        AvailableProducts = availableProducts;
    }

    public int Id { get; private set; }
    public string Login { get; private set; }
    public string Password { get; private set; }
    public string Avatar { get; private set; }
    public List<string> AvailableProducts { get; private set; }

    public bool PasswordMatches(string passwordToTest)
    {
        return Password == passwordToTest;
    }
}
