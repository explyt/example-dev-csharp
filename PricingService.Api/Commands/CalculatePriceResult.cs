using System;
using System.Collections.Generic;

namespace PricingService.Api.Commands;

public class CalculatePriceResult
{
    public decimal TotalPrice { get; set; }
    public Dictionary<string, decimal> CoverPrices { get; set; }
    
    // NEW: Detailed calculation for each cover
    public List<CoverCalculationDetails> CoverCalculationDetails { get; set; }
    
    // NEW: Warnings and messages
    public List<string> Warnings { get; set; }
    
    // NEW: Calculation identifier for tracking
    public string CalculationId { get; set; }
    
    // NEW: Timestamps
    public DateTimeOffset CalculatedAt { get; set; }
    public DateTimeOffset ExpiresAt { get; set; }

    public static CalculatePriceResult Empty()
    {
        return new CalculatePriceResult { 
            TotalPrice = 0M, 
            CoverPrices = new Dictionary<string, decimal>(),
            CoverCalculationDetails = new List<CoverCalculationDetails>(),
            Warnings = new List<string>(),
            CalculationId = Guid.NewGuid().ToString(),
            CalculatedAt = DateTimeOffset.UtcNow,
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(1)
        };
    }
}

public class CoverCalculationDetails
{
    public string CoverCode { get; set; }
    public string CoverName { get; set; }
    public decimal BasePrice { get; set; }
    public List<PriceFactor> AppliedFactors { get; set; }
    public string Description { get; set; }
}

public class PriceFactor
{
    public string FactorName { get; set; }
    public decimal FactorValue { get; set; }
    public decimal AppliedModifier { get; set; }
    public string Description { get; set; }
}
