using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using PolicyService.DataAccess.NHibernate;
using PolicyService.Messaging.MassTransit;
using PolicyService.RestClients;


namespace PolicyService;

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
            .AddNewtonsoftJson();
        services.AddMediatR(opts => opts.RegisterServicesFromAssemblyContaining<Startup>());
        services.AddPricingRestClient();
        services.AddMassTransitListeners();
        services.AddSwaggerGen();
    }

    // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
    public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
    {
        app.UseExceptionHandler("/error");

        if (!env.IsDevelopment()) app.UseHsts();
        
        if (env.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI();
        }

        app.UseRouting();
        app.UseHttpsRedirection();
        app.UseEndpoints(endpoints => endpoints.MapControllers());
    }
}