using System.ComponentModel.DataAnnotations;
using MediatR;
using ProductService.Api.Commands;
using ProductService.Domain;

namespace ProductService.Commands;

public class ActivateProductHandler : IRequestHandler<ActivateProductCommand, ActivateProductResult>
{
    private readonly IProductRepository products;

    public ActivateProductHandler(IProductRepository products)
    {
        this.products = products;
    }

    public async Task<ActivateProductResult> Handle(ActivateProductCommand request, CancellationToken cancellationToken)
    {
        var product = await products.FindById(request.ProductId);
        if (product == null) return null;
        product.Activate();
        return new ActivateProductResult
        {
            ProductId = product.Id
        };
    }
}