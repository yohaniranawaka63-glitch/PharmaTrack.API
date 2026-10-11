FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["PharmaTrack.API.csproj", "./"]
RUN dotnet restore "PharmaTrack.API.csproj"

COPY . .
RUN dotnet publish "PharmaTrack.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "PharmaTrack.API.dll"]
