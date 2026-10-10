using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PharmaTrack.API.Migrations
{
    /// <inheritdoc />
    public partial class AddMedicineBatchIsActive : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "MedicineBatch",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "MedicineBatch");
        }
    }
}
