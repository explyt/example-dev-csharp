using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using PricingService.Api.Commands;

namespace PricingService.Controllers;

[Route("api/[controller]")]
[ApiController]
public class PricingController : ControllerBase
{
    private readonly IMediator bus;

    public PricingController(IMediator bus)
    {
        this.bus = bus;
    }

    // POST api/v2/pricing/calculate-price
    // New version 2 endpoint with enhanced functionality
    [HttpPost("/api/v2/[controller]/calculate-price")]
    public async Task<ActionResult> CalculatePriceV2([FromBody] CalculatePriceCommand cmd)
    {
        var result = await bus.Send(cmd);
        
        // For V2, we ensure all new fields are populated
        if (result.CalculationId == null)
        {
            result.CalculationId = Guid.NewGuid().ToString();
        }
        
        if (result.CalculatedAt == default(DateTimeOffset))
        {
            result.CalculatedAt = DateTimeOffset.UtcNow;
            result.ExpiresAt = DateTimeOffset.UtcNow.AddDays(1);
        }
        
        if (result.Warnings == null)
        {
            result.Warnings = new List<string>();
        }
        
        if (result.CoverCalculationDetails == null && cmd.IncludeCalculationDetails)
        {
            result.CoverCalculationDetails = new List<CoverCalculationDetails>();
        }
        
        return new JsonResult(result);
    }
}
