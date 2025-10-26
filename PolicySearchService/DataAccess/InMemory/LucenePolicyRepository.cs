using System;
using System.Collections.Generic;
using System.Globalization;
using System.Threading.Tasks;
using Lucene.Net.Analysis.Standard;
using Lucene.Net.Documents;
using Lucene.Net.Index;
using Lucene.Net.QueryParsers.Classic;
using Lucene.Net.Search;
using Lucene.Net.Store;
using Lucene.Net.Util;
using PolicySearchService.Domain;

namespace PolicySearchService.DataAccess.InMemory;

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

    public Task Add(Policy policy)
    {
        lock (writerLock)
        {
            var doc = new Document
            {
                new StringField("policyNumber", policy.PolicyNumber, Field.Store.YES),
                new TextField("policyHolder", policy.PolicyHolder ?? string.Empty, Field.Store.YES),
                new StringField("productCode", policy.ProductCode ?? string.Empty, Field.Store.YES),
                new StringField("policyStartDate", policy.PolicyStartDate.ToString("o", CultureInfo.InvariantCulture), Field.Store.YES),
                new StringField("policyEndDate", policy.PolicyEndDate.ToString("o", CultureInfo.InvariantCulture), Field.Store.YES),
                new DoubleField("premiumAmount", Convert.ToDouble(policy.PremiumAmount), Field.Store.YES)
            };

            writer.UpdateDocument(new Term("policyNumber", policy.PolicyNumber), doc);
            writer.Flush(triggerMerge: false, applyAllDeletes: false);
            writer.Commit();
        }
        
        return Task.CompletedTask;
    }

    public Task<List<Policy>> Find(string queryText)
    {
        using var reader = writer.GetReader(applyAllDeletes: true);
        var searcher = new IndexSearcher(reader);
        
        var queryParser = new MultiFieldQueryParser(
            AppLuceneVersion,
            ["policyNumber", "policyHolder"],
            new StandardAnalyzer(AppLuceneVersion))
        {
            DefaultOperator = Operator.OR
        };

        var parsedQuery = queryParser.Parse(queryText);
        var hits = searcher.Search(parsedQuery, 10);
        
        var policies = new List<Policy>();
        foreach (var scoreDoc in hits.ScoreDocs)
        {
            var doc = searcher.Doc(scoreDoc.Doc);
            policies.Add(DocToPolicy(doc));
        }
        
        return Task.FromResult(policies);
    }

    private static Policy DocToPolicy(Document doc)
    {
        return new Policy
        {
            PolicyNumber = doc.Get("policyNumber"),
            PolicyHolder = doc.Get("policyHolder"),
            ProductCode = doc.Get("productCode"),
            PolicyStartDate = DateTimeOffset.Parse(doc.Get("policyStartDate"), null, DateTimeStyles.RoundtripKind),
            PolicyEndDate = DateTimeOffset.Parse(doc.Get("policyEndDate"), null, DateTimeStyles.RoundtripKind),
            PremiumAmount = Convert.ToDecimal(doc.Get("premiumAmount"))
        };
    }

    public void Dispose()
    {
        writer?.Dispose();
        directory?.Dispose();
    }
}
