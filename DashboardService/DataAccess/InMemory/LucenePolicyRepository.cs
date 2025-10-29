using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading.Tasks;
using Lucene.Net.Analysis.Standard;
using Lucene.Net.Documents;
using Lucene.Net.Index;
using Lucene.Net.Search;
using Lucene.Net.Store;
using Lucene.Net.Util;
using DashboardService.Domain;

namespace DashboardService.DataAccess.InMemory;

public class LucenePolicyRepository : IPolicyRepository, IDisposable
{
    private const LuceneVersion AppLuceneVersion = LuceneVersion.LUCENE_48;
    private readonly RAMDirectory directory;
    private readonly IndexWriter writer;
    private readonly object writerLock = new();

    public LucenePolicyRepository()
    {
        directory = new RAMDirectory();
        var analyzer = new StandardAnalyzer(AppLuceneVersion);
        var indexConfig = new IndexWriterConfig(AppLuceneVersion, analyzer);
        writer = new IndexWriter(directory, indexConfig);
    }

    public void Save(PolicyDocument policy)
    {
        lock (writerLock)
        {
            var doc = new Document
            {
                new StringField("number", policy.Number, Field.Store.YES),
                new StringField("agentLogin", policy.AgentLogin ?? string.Empty, Field.Store.YES),
                new StringField("productCode", policy.ProductCode ?? string.Empty, Field.Store.YES),
                new StringField("from", policy.From.ToString("o", CultureInfo.InvariantCulture), Field.Store.YES),
                new DoubleField("totalPremium", Convert.ToDouble(policy.TotalPremium), Field.Store.YES)
            };

            writer.UpdateDocument(new Term("number", policy.Number), doc);
            writer.Flush(triggerMerge: false, applyAllDeletes: false);
            writer.Commit();
        }
    }

    public PolicyDocument FindByNumber(string policyNumber)
    {
        using var reader = writer.GetReader(applyAllDeletes: true);
        var searcher = new IndexSearcher(reader);
        var query = new TermQuery(new Term("number", policyNumber));
        var hits = searcher.Search(query, 1);
        if (hits.ScoreDocs.Length == 0) return null;
        var doc = searcher.Doc(hits.ScoreDocs[0].Doc);
        return DocToPolicy(doc);
    }

    public AgentSalesQueryResult GetAgentSales(AgentSalesQuery query)
    {
        var docs = SearchByFilters(query.FilterByAgentLogin, query.FilterByProductCode, query.FilterBySalesDateStart, query.FilterBySalesDateEnd);
        var grouped = docs.GroupBy(d => d.Get("agentLogin"));

        var result = new AgentSalesQueryResult();

        foreach (var g in grouped)
        {
            var count = g.Count();
            var sum = g.Sum(d => Convert.ToDecimal(d.Get("totalPremium")));
            result.AgentResult(g.Key, new SalesResult(count, sum));
        }

        return result;
    }

    public TotalSalesQueryResult GetTotalSales(TotalSalesQuery query)
    {
        var docs = SearchByFilters(null, query.FilterByProductCode, query.FilterBySalesDateStart, query.FilterBySalesDateEnd);
        var result = new TotalSalesQueryResult();
        var grouped = docs.GroupBy(d => d.Get("productCode"));
        foreach (var g in grouped)
        {
            var count = g.Count();
            var sum = g.Sum(d => Convert.ToDecimal(d.Get("totalPremium")));
            result.ProductResult(g.Key, new SalesResult(count, sum));
        }
        return result;
    }

    public SalesTrendsResult GetSalesTrend(SalesTrendsQuery query)
    {
        var docs = SearchByFilters(null, query.FilterByProductCode, query.FilterBySalesDateStart, query.FilterBySalesDateEnd);
            var periods = docs.GroupBy(d =>
        {
            var dt = DateTime.Parse(d.Get("from"), null, DateTimeStyles.RoundtripKind);
            return query.AggregationUnit switch
            {
                TimeAggregationUnit.Month => new DateTime(dt.Year, dt.Month, 1),
                TimeAggregationUnit.Week => dt.Date.AddDays(-(int)dt.DayOfWeek),
                TimeAggregationUnit.Day => dt.Date,
                _ => dt.Date
            };
        }).OrderBy(g => g.Key);

        var result = new SalesTrendsResult();

        foreach (var p in periods)
        {
            var periodStart = p.Key;
            var docCount = p.Count();
            var totalPremium = p.Sum(d => Convert.ToDecimal(d.Get("totalPremium")));
            result.PeriodResult(new PeriodSales(periodStart, periodStart.ToShortDateString(), new SalesResult(docCount, totalPremium)));
        }

        return result;
    }

    private IEnumerable<Document> SearchByFilters(string agentLogin, string productCode, DateTime fromDate, DateTime toDate)
    {
        using var reader = writer.GetReader(applyAllDeletes: true);
        var searcher = new IndexSearcher(reader);

        var queries = new List<Query>();

        if (!string.IsNullOrWhiteSpace(agentLogin))
            queries.Add(new TermQuery(new Term("agentLogin", agentLogin)));

        if (!string.IsNullOrWhiteSpace(productCode))
            queries.Add(new TermQuery(new Term("productCode", productCode)));

        if (fromDate != default || toDate != default)
        {
            // we stored date as ISO string, parse and compare
            // Simple approach: retrieve all and filter by date
        }

        Query finalQuery = queries.Count == 0 ? new MatchAllDocsQuery() : (queries.Count == 1 ? queries[0] : new BooleanQuery { { queries[0], Occur.MUST }, { queries[1], Occur.MUST } });

        var hits = searcher.Search(finalQuery, int.MaxValue);
        var docs = hits.ScoreDocs.Select(sd => searcher.Doc(sd.Doc)).ToList();

        if (fromDate != default || toDate != default)
        {
            docs = docs.Where(d =>
            {
                var dt = DateTime.Parse(d.Get("from"), null, DateTimeStyles.RoundtripKind);
                if (fromDate != default && dt < fromDate) return false;
                if (toDate != default && dt > toDate) return false;
                return true;
            }).ToList();
        }

        return docs;
    }

    private static PolicyDocument DocToPolicy(Document doc)
    {
        var number = doc.Get("number");
        var from = DateTime.Parse(doc.Get("from"), null, DateTimeStyles.RoundtripKind);
        var to = from.AddYears(1).AddDays(-1);
        var insured = doc.Get("insuredName");
        var product = doc.Get("productCode");
        var premium = Convert.ToDecimal(doc.Get("totalPremium"));
        var agent = doc.Get("agentLogin");

        return new PolicyDocument(number, from, to, insured, product, premium, agent);
    }

    public void Dispose()
    {
        writer?.Dispose();
        directory?.Dispose();
    }
    
    public Task Clear()
    {
        lock (writerLock)
        {
            writer.DeleteAll();
            writer.Flush(triggerMerge: false, applyAllDeletes: false);
            writer.Commit();
        }

        return Task.CompletedTask;
    }
}