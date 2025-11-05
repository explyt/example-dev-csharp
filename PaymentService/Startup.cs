using GlobalExceptionHandler.WebApi;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Newtonsoft.Json;
using PaymentService.Configuration;
using PaymentService.DataAccess.EF;
using PaymentService.Domain;
using PaymentService.Infrastructure;
using PaymentService.Init;
using PaymentService.Jobs;
using PaymentService.Messaging.SignalR;

namespace PaymentService;

public class Startup
{
    public Startup(IConfiguration configuration)
    {
        Configuration = configuration;
    }

    public IConfiguration Configuration { get; }

    // This method gets called by the runtime. Use this method to add services to the container.
    public void ConfigureServices(IServiceCollection services)
    {
        services.AddMvc()
            .AddNewtonsoftJson(opt => { opt.SerializerSettings.TypeNameHandling = TypeNameHandling.Auto; });

        services.AddEFConfiguration();
        services.AddPaymentDemoInitializer();
        services.AddMediatR(opts => opts.RegisterServicesFromAssemblyContaining<Startup>());
        services.AddLogingBehaviour();
        services.AddSingleton<PolicyAccountNumberGenerator>();
        services.UseSignalR(Configuration);
        services.AddBackgroundJobs(Configuration.GetSection("BackgroundJobs").Get<BackgroundJobsConfig>());
        services.AddSwaggerGen();
    }

    // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
    public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
    {
        app.UseRouting();
        app.UseGlobalExceptionHandler(cfg => cfg.MapExceptions());
        if (!env.IsDevelopment()) app.UseHsts();
        
        if (env.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI();
        }

        app.UseHttpsRedirection();
        _ = app.UseInitializer();
        app.UseBackgroundJobs();
        app.UseEndpoints(endpoints => endpoints.MapControllers());
    }
}