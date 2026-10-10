using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PharmaTrack.API.Migrations
{
    /// <inheritdoc />
    public partial class AddOtherItemToSaleItem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "BatchId",
                table: "SaleItem",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddColumn<int>(
                name: "OtherItemId",
                table: "SaleItem",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OtherItemId",
                table: "SaleItem");

            migrationBuilder.AlterColumn<int>(
                name: "BatchId",
                table: "SaleItem",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);
        }
    }
}
