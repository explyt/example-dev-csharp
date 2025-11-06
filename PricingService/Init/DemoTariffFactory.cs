using PricingService.Domain;

namespace PricingService.Init;

internal static class DemoTariffFactory
{
    internal static Tariff Travel()
    {
        var travel = new Tariff("TRI");
        travel.AddBasePremiumRule(new BasePremiumCalculationRule("C1", null,
            "(NUM_OF_ADULTS) * (DESTINATION == \"EUR\" ? 26.00M : 34.00M)"));
        travel.AddBasePremiumRule(new BasePremiumCalculationRule("C2", null, "(NUM_OF_ADULTS + NUM_OF_CHILDREN) * 26.00M"));
        travel.AddBasePremiumRule(new BasePremiumCalculationRule("C3", null, "(NUM_OF_ADULTS + NUM_OF_CHILDREN) * 10.00M"));

        travel.AddDiscountMarkupRule(new PercentMarkupRule("DESTINATION == \"WORLD\"", 1.5M));

        return travel;
    }

    internal static Tariff House()
    {
        var house = new Tariff("HSI");

        house.AddBasePremiumRule(new BasePremiumCalculationRule("C1", "TYP == \"APT\"", "AREA * 1.25M"));
        house.AddBasePremiumRule(new BasePremiumCalculationRule("C1", "TYP == \"HOUSE\"", "AREA * 1.50M"));

        house.AddBasePremiumRule(new BasePremiumCalculationRule("C2", "TYP == \"APT\"", "AREA * 0.25M"));
        house.AddBasePremiumRule(new BasePremiumCalculationRule("C2", "TYP == \"HOUSE\"", "AREA * 0.45M"));

        house.AddBasePremiumRule(new BasePremiumCalculationRule("C3", null, "30M"));
        house.AddBasePremiumRule(new BasePremiumCalculationRule("C4", null, "50M"));

        house.AddDiscountMarkupRule(new PercentMarkupRule("FLOOD == \"YES\"", 1.50M));
        house.AddDiscountMarkupRule(new PercentMarkupRule("NUM_OF_CLAIM > 1 ", 1.25M));

        return house;
    }

    internal static Tariff Farm()
    {
        var farm = new Tariff("FAI");

        farm.AddBasePremiumRule(new BasePremiumCalculationRule("C1", null, "10M"));
        farm.AddBasePremiumRule(new BasePremiumCalculationRule("C2", null, "20M"));
        farm.AddBasePremiumRule(new BasePremiumCalculationRule("C3", null, "30M"));
        farm.AddBasePremiumRule(new BasePremiumCalculationRule("C4", null, "40M"));

        //farm.AddDiscountMarkupRule(new PercentMarkupRule("FLOOD == \"YES\"", 1.50M));
        farm.AddDiscountMarkupRule(new PercentMarkupRule("NUM_OF_CLAIM > 2", 2.00M));

        return farm;
    }

    internal static Tariff Car()
    {
        var car = new Tariff("CAR");

        car.AddBasePremiumRule(new BasePremiumCalculationRule("C1", null, "100M"));
        car.AddDiscountMarkupRule(new PercentMarkupRule("NUM_OF_CLAIM > 2", 1.50M));

        return car;
    }
}