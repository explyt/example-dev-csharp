using System;
using System.Collections.Generic;
using Newtonsoft.Json;

namespace PricingService.Domain;

public class Tariff
{
    // JSON strings for EF storage
    public string BasePremiumRulesJson { get; private set; }

    public string DiscountMarkupRulesJson { get; private set; }

    // Parameterless constructor for Entity Framework
    protected Tariff()
    {
        Id = Guid.NewGuid();
        BasePremiumRulesJson = "[]";
        DiscountMarkupRulesJson = "[]";
    }

    public Tariff(string code) : this()
    {
        Code = code;
    }

    public Guid Id { get; private set; }
    public string Code { get; private set; }

    [JsonIgnore] 
    public BasePremiumCalculationRuleList BasePremiumRules 
    {
        get
        {
            var rules = Newtonsoft.Json.JsonConvert.DeserializeObject<List<BasePremiumCalculationRule>>(BasePremiumRulesJson) 
                        ?? new List<BasePremiumCalculationRule>();
            return new BasePremiumCalculationRuleList(rules);
        }
    }

    [JsonIgnore] 
    public DiscountMarkupRuleList DiscountMarkupRules 
    {
        get
        {
            var settings = new Newtonsoft.Json.JsonSerializerSettings
            {
                TypeNameHandling = Newtonsoft.Json.TypeNameHandling.Auto
            };
            var rules = Newtonsoft.Json.JsonConvert.DeserializeObject<List<DiscountMarkupRule>>(DiscountMarkupRulesJson, settings) 
                        ?? new List<DiscountMarkupRule>();
            return new DiscountMarkupRuleList(rules);
        }
    }

    // Helper methods to add rules
    public void AddBasePremiumRule(BasePremiumCalculationRule rule)
    {
        var rules = Newtonsoft.Json.JsonConvert.DeserializeObject<List<BasePremiumCalculationRule>>(BasePremiumRulesJson) 
                    ?? new List<BasePremiumCalculationRule>();
        rules.Add(rule);
        BasePremiumRulesJson = Newtonsoft.Json.JsonConvert.SerializeObject(rules);
    }

    public void AddDiscountMarkupRule(DiscountMarkupRule rule)
    {
        var settings = new Newtonsoft.Json.JsonSerializerSettings
        {
            TypeNameHandling = Newtonsoft.Json.TypeNameHandling.Auto
        };
        var rules = Newtonsoft.Json.JsonConvert.DeserializeObject<List<DiscountMarkupRule>>(DiscountMarkupRulesJson, settings) 
                    ?? new List<DiscountMarkupRule>();
        rules.Add(rule);
        DiscountMarkupRulesJson = Newtonsoft.Json.JsonConvert.SerializeObject(rules, settings);
    }

    public Calculation CalculatePrice(Calculation calculation)
    {
        CalcBasePrices(calculation);
        ApplyDiscounts(calculation);
        UpdateTotals(calculation);
        return calculation;
    }


    private void CalcBasePrices(Calculation calculation)
    {
        foreach (var cover in calculation.Covers.Values)
            cover.SetPrice(BasePremiumRules.CalculateBasePriceFor(cover, calculation));
    }

    private void ApplyDiscounts(Calculation calculation)
    {
        DiscountMarkupRules.Apply(calculation);
    }

    private void UpdateTotals(Calculation calculation)
    {
        calculation.UpdateTotal();
    }
}