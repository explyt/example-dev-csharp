using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using ProductService.DataAccess.EF;
using ProductService.Domain;
using ProductService.Init;

namespace ProductService;

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
        services.AddControllers().AddNewtonsoftJson(options =>
        {
            options.SerializerSettings.Converters.Add(new StringEnumConverter());
            options.SerializerSettings.NullValueHandling = NullValueHandling.Ignore;
        });
        
        services.AddMediatR(cfg => cfg.RegisterServicesFromAssemblyContaining<Program>());
        services.AddProductDemoInitializer();
        
        services.AddSwaggerGen();
        
        services.AddDbContext<ProductDbContext>(options => options.UseInMemoryDatabase("ProductServiceDb"));
        services.AddScoped<IProductRepository, ProductRepository>();
    }

    // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
    public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
    {
        if (env.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI();
        }

        app.UseRouting();
        
        app.UseHttpsRedirection();
        app.UseAuthorization();

        // Ensure initializer is awaited so seeding completes before the app starts handling requests
        app.UseInitializer();
        app.UseEndpoints(endpoints => endpoints.MapControllers());
    }
}