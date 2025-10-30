namespace MicroservicesOrchestrator;

public class Program
{
    public static void Main(string[] args)
    {
        var builder = DistributedApplication.CreateBuilder(args);

        // Core Services
        var pricingService = builder.AddProject<Projects.PricingService>("pricing-service")
            .WithHttpEndpoint(port: 5030, name: "pricing-service");

        var authService = builder.AddProject<Projects.AuthService>("auth-service")
            .WithHttpEndpoint(port: 6060, name: "auth-service");

        var policyService = builder.AddProject<Projects.PolicyService>("policy-service")
            .WithHttpEndpoint(port: 5040, name: "policy-service")
            .WithReference(pricingService);

        var paymentService = builder.AddProject<Projects.PaymentService>("payment-service")
            .WithHttpEndpoint(port: 5070, name: "payment-service");

        var productService = builder.AddProject<Projects.ProductService>("product-service")
            .WithHttpEndpoint(port: 5031, name: "product-service");

        var policySearchService = builder.AddProject<Projects.PolicySearchService>("policy-search-service")
            .WithHttpEndpoint(port: 5065, name: "policy-search-service");

        var chatService = builder.AddProject<Projects.ChatService>("chat-service")
            .WithHttpEndpoint(port: 4099, name: "chat-service")
            .WithReference(authService);

        var dashboardService = builder.AddProject<Projects.DashboardService>("dashboard-service")
            .WithHttpEndpoint(port: 5035, name: "dashboard-service");

        // API Gateway
        var apiGateway = builder.AddProject<Projects.AgentPortalApiGateway>("api-gateway")
            .WithHttpEndpoint(port: 8099, name: "api-gateway")
            .WithReference(pricingService)
            .WithReference(policyService)
            .WithReference(paymentService)
            .WithReference(productService)
            .WithReference(policySearchService)
            .WithReference(chatService)
            .WithReference(dashboardService)
            .WithReference(authService);

        // Blazor WASM Client
        var blazorClient = builder.AddProject<Projects.BlazorWasmClient>("blazor-client")
            .WithHttpEndpoint(port: 5081, name: "blazor-client")
            .WithReference(apiGateway)
            .WithExternalHttpEndpoints();

        builder.Build().Run();
    }
}