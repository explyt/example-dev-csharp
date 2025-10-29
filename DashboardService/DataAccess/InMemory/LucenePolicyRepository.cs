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
using DashboardService.Domain;
using Version = Lucene.Net.Util.Version;
namespace DashboardService.DataAccess.InMemory;

public class LucenePolicyRepository : IPolicyRepository, IDisposable
{
    private const Version AppLuceneVersion = Version.LUCENE_30;
    private readonly RAMDirectory directory;
    private readonly IndexWriter writer;
    private readonly object writerLock = new();

    public LucenePolicyRepository()
    {
        directory = new RAMDirectory();
        var analyzer = new StandardAnalyzer(AppLuceneVersion);
        writer = new IndexWriter(directory, analyzer, IndexWriter.MaxFieldLength.UNLIMITED);
    }

    public void Save(PolicyDocument policy)
    {
        lock (writerLock)
        {
            var doc = new Document();
            doc.Add(new Field("number", policy.Number, Field.Store.YES, Field.Index.NOT_ANALYZED));
            doc.Add(new Field("agentLogin", policy.AgentLogin ?? string.Empty, Field.Store.YES, Field.Index.NOT_ANALYZED));
            doc.Add(new Field("productCode", policy.ProductCode ?? string.Empty, Field.Store.YES, Field.Index.NOT_ANALYZED));
            doc.Add(new Field("from", policy.From.ToString("o", CultureInfo.InvariantCulture), Field.Store.YES, Field.Index.NOT_ANALYZED));
            doc.Add(new Field("to", policy.To.ToString("o", CultureInfo.InvariantCulture), Field.Store.YES, Field.Index.NOT_ANALYZED));
            doc.Add(new Field("salesDate", policy.SalesDate.ToString("o", CultureInfo.InvariantCulture), Field.Store.YES, Field.Index.NOT_ANALYZED));
            doc.Add(new Field("policyHolder", policy.PolicyHolder, Field.Store.YES, Field.Index.NOT_ANALYZED));
            doc.Add(new Field("totalPremium", Convert.ToDouble(policy.TotalPremium).ToString(CultureInfo.InvariantCulture), Field.Store.YES, Field.Index.NOT_ANALYZED));

            writer.UpdateDocument(new Term("number", policy.Number), doc);
            writer.Flush(false, false, false);
            writer.Commit();
        }
    }

    public PolicyDocument FindByNumber(string policyNumber)
    {
        using var reader = IndexReader.Open(directory, true);
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
            var dt = DateTime.Parse(d.Get("salesDate"), null, DateTimeStyles.RoundtripKind);
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
        using var reader = IndexReader.Open(directory, true);
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

        Query finalQuery;
        if (queries.Count == 0)
        {
            finalQuery = new MatchAllDocsQuery();
        }
        else if (queries.Count == 1)
        {
            finalQuery = queries[0];
        }
        else
        {
            var boolQuery = new BooleanQuery();
            foreach (var q in queries)
            {
                boolQuery.Add(q, Occur.MUST);
            }
            finalQuery = boolQuery;
        }

        var hits = searcher.Search(finalQuery, int.MaxValue);
        var docs = hits.ScoreDocs.Select(sd => searcher.Doc(sd.Doc)).ToList();

        if (fromDate != default || toDate != default)
        {
            docs = docs.Where(d =>
            {
                var dt = DateTime.Parse(d.Get("salesDate"), null, DateTimeStyles.RoundtripKind);
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
        var to = DateTime.Parse(doc.Get("to"), null, DateTimeStyles.RoundtripKind);
        var salesDate = DateTime.Parse(doc.Get("salesDate"), null, DateTimeStyles.RoundtripKind);
        var policyHolder = doc.Get("policyHolder");
        var productCode = doc.Get("productCode");
        var totalPremium = Convert.ToDecimal(doc.Get("totalPremium"));
        var agentLogin = doc.Get("agentLogin");

        return new PolicyDocument(number, from, to, salesDate, policyHolder, productCode, totalPremium, agentLogin);
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
            writer.Commit();
        }

        return Task.CompletedTask;
    }
}