# --- Build stage ---
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy csproj files first (layer caching — dependencies re-install only if csproj changes)
COPY SlotGame.Core/SlotGame.Core.csproj SlotGame.Core/
COPY SlotGame.Infrastructure/SlotGame.Infrastructure.csproj SlotGame.Infrastructure/
COPY SlotGame.Api/SlotGame.Api.csproj SlotGame.Api/
RUN dotnet restore SlotGame.Api/SlotGame.Api.csproj

# Copy everything else, build
COPY SlotGame.Core/ SlotGame.Core/
COPY SlotGame.Infrastructure/ SlotGame.Infrastructure/
COPY SlotGame.Api/ SlotGame.Api/
RUN dotnet publish SlotGame.Api/SlotGame.Api.csproj -c Release -o /app/publish


# --- Runtime stage ---
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "SlotGame.Api.dll"]