using System.Net;
using System.Net.Sockets;

namespace TestHelpers;

/// <summary>
/// Helper class to get random available ports for testing
/// </summary>
public static class PortHelper
{
    /// <summary>
    /// Gets a random available TCP port by binding to port 0 and letting the OS assign one
    /// </summary>
    /// <returns>An available port number</returns>
    public static int GetAvailablePort()
    {
        using var listener = new TcpListener(IPAddress.Loopback, 0);
        listener.Start();
        var port = ((IPEndPoint)listener.LocalEndpoint).Port;
        listener.Stop();
        return port;
    }
}
