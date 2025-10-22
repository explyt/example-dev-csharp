#!/bin/bash

# Start all microservices for the Agent Portal
# This script starts all backend services in the correct order before starting the API Gateway

echo "Starting DotNet Microservices POC..."

# Function to start a service in the background
start_service() {
    local service_name=$1
    local project_path=$2
    local port=$3
    
    echo "Starting $service_name on port $port..."
    dotnet run --project "$project_path" &
    local pid=$!
    echo "$service_name started with PID: $pid"
    
    # Wait a bit for the service to start
    sleep 3
    
    # Check if service is running
    if curl -s "http://localhost:$port/health" > /dev/null 2>&1; then
        echo "✓ $service_name is running on http://localhost:$port"
    else
        echo "⚠ $service_name might not be fully started yet"
    fi
}

# Start services in the order they're needed
# 1. Auth Service (port 6060)
start_service "Auth Service" "AuthService/AuthService.csproj" "6060"

# 2. Product Service (port 5030) - used by API Gateway
start_service "Product Service" "ProductService/ProductService.csproj" "5030"

# 3. Dashboard Service (port 5035) - used by API Gateway  
start_service "Dashboard Service" "DashboardService/DashboardService.csproj" "5035"

# 4. Policy Service (port 5040) - used by API Gateway
start_service "Policy Service" "PolicyService/PolicyService.csproj" "5040"

# 5. Pricing Service (port 5050) - if needed
start_service "Pricing Service" "PricingService/PricingService.csproj" "5050"

# Wait for all services to be ready
echo "Waiting for services to be ready..."
sleep 5

# Start the API Gateway (port 8099)
echo "Starting Agent Portal API Gateway on port 8099..."
dotnet run --project "AgentPortalApiGateway/AgentPortalApiGateway.csproj"

# If we get here, the API Gateway has stopped
echo "API Gateway stopped. Cleaning up..."

# Kill all background processes
echo "Stopping all services..."
kill $(jobs -p) 2>/dev/null

echo "All services stopped."