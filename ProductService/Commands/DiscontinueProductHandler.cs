using MediatR;
using ProductService.Api.Commands;
using ProductService.Domain;

namespace ProductService.Commands;

public class DiscontinueProductHandler : IRequestHandler<DiscontinueProductCommand, DiscontinueProductResult>
{
    private readonly IProductRepository products;

    public DiscontinueProductHandler(IProductRepository products)
    {
        this.products = products;
    }

    public async Task<DiscontinueProductResult> Handle(DiscontinueProductCommand request,
        CancellationToken cancellationToken)
    {
        var product = await products.FindById(request.ProductId);
        if (product == null) return null;
        product.Discontinue();
        return new DiscontinueProductResult
        {
            ProductId = product.Id
        };
    }
}