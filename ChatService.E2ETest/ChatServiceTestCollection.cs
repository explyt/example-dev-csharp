using Xunit;

namespace ChatService.E2ETest;

/// <summary>
/// Collection definition to ensure tests run sequentially to avoid port conflicts
/// </summary>
[CollectionDefinition(nameof(ChatServiceTestCollection), DisableParallelization = true)]
public class ChatServiceTestCollection
{
}
