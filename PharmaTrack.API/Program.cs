using Microsoft.EntityFrameworkCore;
using PharmaTrack.API.Data;
using PharmaTrack.API.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers()

    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler =
            System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });
    builder.Services.AddScoped<EmailService>();


builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173",
                "https://pharmatrack-frontend-sooty.vercel.app",
                "https://pharmatrack-frontend-isc0qzae9-pharma-track1.vercel.app"
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddDbContext<PharmaTrackDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")
    ));

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("AllowFrontend");

app.UseAuthorization();

app.MapControllers();

app.Run();