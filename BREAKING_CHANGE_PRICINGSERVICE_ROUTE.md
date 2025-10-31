# Breaking Change: PricingService CalculatePrice Route Modification

## Overview
This document describes a breaking change to the `CalculatePrice` endpoint in the PricingService. The change modifies the route structure to better align with RESTful conventions and improve API consistency.

## Current Implementation
The current `CalculatePrice` endpoint is accessed through a client interface in the PolicyService:
```csharp
public async Task<Price> CalculatePrice(PricingParams pricingParams)
```

The method uses a command pattern with the following structure:
- Command: `CalculatePriceCommand`
- Parameters include: `ProductCode`, `PolicyFrom`, `PolicyTo`, `SelectedCovers`, and `Answers`
- Result: `CalculatePriceResult` containing `TotalPrice` and `CoverPrices`

## Proposed Breaking Change
### Route Modification
**From:** POST `/calculateprice` (assumed standard route)
**To:** POST `/v1/pricing/calculate`

### Request Body Changes
The request body structure will be enhanced with versioning considerations:

```json
{
  "productCode": "string",
  "policyFrom": "2023-06-01T00:00:00Z",
  "policyTo": "2024-06-01T00:00:00Z",
  "selectedCovers": ["string"],
  "answers": [
    {
      "questionCode": "string",
      "answer": "object",
      "type": "string"
    }
  ]
}
```

### Response Structure
The response will remain largely the same but will include additional metadata:

```json
{
  "totalPrice": 0,
  "coverPrices": {
    "string": 0
  },
  "calculationId": "string",
  "validUntil": "2023-06-01T00:00:00Z"
}
```

## Impact Assessment
### Affected Services
1. **PolicyService** - Primary consumer of the PricingService
   - Update required in `PricingService.cs` client implementation
   - Changes to the `IPricingService` interface
   - Update dependency references

2. **Frontend Applications** - Any direct consumers of the PricingService
   - Route URL updates in configuration
   - Potential caching invalidation

### Migration Steps
1. Update the PricingService API to the new route `/v1/pricing/calculate`
2. Modify the PolicyService `PricingService.cs` to use the new endpoint
3. Update any API gateway or reverse proxy configurations
4. Update API documentation and SDKs
5. Coordinate deployment to ensure compatibility

## Implementation Timeline
- **Week 1**: API development and internal testing
- **Week 2**: Integration testing with PolicyService
- **Week 3**: Staged rollout with backward compatibility layer
- **Week 4**: Full migration and deprecation of old endpoint

## Rollback Plan
In case of critical issues, we can:
1. Revert the PricingService to the previous version
2. Temporarily maintain both endpoints with a deprecation warning
3. Update PolicyService to use the original route

## Conclusion
This breaking change improves the API design by introducing proper versioning and clearer resource naming. While requiring coordinated updates across services, it establishes a more maintainable foundation for future enhancements.