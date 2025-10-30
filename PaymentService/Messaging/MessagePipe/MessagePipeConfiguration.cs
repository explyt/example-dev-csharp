namespace PaymentService.Messaging.MessagePipe;

public class MessagePipeConfiguration
{
    public string Host { get; set; } = "127.0.0.1";
    public int Port { get; set; } = 8083;
    public bool IsServer { get; set; } = false;
}
