using System;
using System.Collections.Generic;
using FluentValidation;
using MediatR;
using PricingService.Api.Commands.Dto;

namespace PricingService.Api.Commands;

public class CalculatePriceCommand : IRequest<CalculatePriceResult>
{
    public string ProductCode { get; set; }
    public DateTimeOffset PolicyFrom { get; set; }
    public DateTimeOffset PolicyTo { get; set; }
    public List<string> SelectedCovers { get; set; }
    public List<QuestionAnswer> Answers { get; set; }
    
    // NEW: Client information for price personalization
    public ClientInfo ClientInfo { get; set; }
    
    // NEW: Request context
    public RequestContext Context { get; set; }
    
    // NEW: Flag to include calculation details
    public bool IncludeCalculationDetails { get; set; } = false;
    
    // NEW: Currency code for calculation (default - USD)
    public string CurrencyCode { get; set; } = "USD";
}

public class ClientInfo
{
    public int Age { get; set; }
    public string Region { get; set; }
    public bool IsVip { get; set; }
    public int YearsAsCustomer { get; set; }
}

public class RequestContext
{
    public string Channel { get; set; } // Web, Mobile, Partner, etc.
    public string SessionId { get; set; }
    public string CampaignCode { get; set; }
}

public class CalculatePriceCommandValidator : AbstractValidator<CalculatePriceCommand>
{
    public CalculatePriceCommandValidator()
    {
        RuleFor(m => m.ProductCode).NotEmpty();
        RuleFor(m => m.SelectedCovers).NotNull();
        RuleFor(m => m.Answers).NotNull();
    }
}
