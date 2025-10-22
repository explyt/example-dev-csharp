using Hangfire;
using Hangfire.Logging.LogProviders;
using Hangfire.MemoryStorage;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;

namespace PaymentService.Jobs;

public static class JobsInstaller
{
    public static IServiceCollection AddBackgroundJobs(
        this IServiceCollection services,
        BackgroundJobsConfig jobsConfig)
    {
        services.AddSingleton(jobsConfig);
        services.AddHangfire(config =>
        {
            config.UseMemoryStorage();
            config.UseLogProvider(new ColouredConsoleLogProvider());
        });
        services.AddScoped<InPaymentRegistrationJob, InPaymentRegistrationJob>();
        services.AddHangfireServer();
        return services;
    }

    public static void UseBackgroundJobs(this IApplicationBuilder app)
    {
        app.UseHangfireDashboard();
        RecurringJob.AddOrUpdate<InPaymentRegistrationJob>(j => j.Run(), "*/1 * * * *");
    }
}
