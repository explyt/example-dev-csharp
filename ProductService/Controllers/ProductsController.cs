using MediatR;
using Microsoft.AspNetCore.Mvc;
using ProductService.Api.Commands;
using ProductService.Api.Queries;

namespace ProductService.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ProductsController : ControllerBase
{
    private readonly IMediator mediator;

    public ProductsController(IMediator mediator)
    {
        this.mediator = mediator ?? throw new ArgumentNullException(nameof(mediator));
    }

    // GET api/products
    [HttpGet]
    public async Task<ActionResult> GetAll()
    {
        var result = await mediator.Send(new FindAllProductsQuery());
        return new JsonResult(result);
    }

    // GET api/products/{code}
    [HttpGet("{code}")]
    public async Task<ActionResult> GetByCode([FromRoute] string code)
    {
        var result = await mediator.Send(new FindProductByCodeQuery { ProductCode = code });
        if (result is null) return NotFound(new { message = $"Product with code {code} not found" });
        return new JsonResult(result);
    }

    // POST api/products
    [HttpPost]
    public async Task<ActionResult> PostDraft([FromBody] CreateProductDraftCommand request)
    {
        var result = await mediator.Send(request);
        return new JsonResult(result);
    }

    // POST api/products/activate
    [HttpPost("activate")]
    public async Task<ActionResult> Activate([FromBody] ActivateProductCommand request)
    {
        var result = await mediator.Send(request);
        if (result is null) return NotFound(new { message = $"Product with id {request.ProductId} not found" });
        return new JsonResult(result);
    }

    // POST api/products/discontinue
    [HttpPost("discontinue")]
    public async Task<ActionResult> Discontinue([FromBody] DiscontinueProductCommand request)
    {
        var result = await mediator.Send(request);
        if (result is null) return NotFound(new { message = $"Product with id {request.ProductId} not found" });
        return new JsonResult(result);
    }
}