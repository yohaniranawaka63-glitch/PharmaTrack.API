using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace PharmaTrack.API.Migrations
{
    /// <inheritdoc />
    public partial class AddProductCategory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ProductCategoryCategoryId",
                table: "OtherItem",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ProductCategory",
                columns: table => new
                {
                    CategoryId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CategoryName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Status = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductCategory", x => x.CategoryId);
                });

            migrationBuilder.CreateIndex(
                name: "IX_OtherItem_ProductCategoryCategoryId",
                table: "OtherItem",
                column: "ProductCategoryCategoryId");

            migrationBuilder.AddForeignKey(
                name: "FK_OtherItem_ProductCategory_ProductCategoryCategoryId",
                table: "OtherItem",
                column: "ProductCategoryCategoryId",
                principalTable: "ProductCategory",
                principalColumn: "CategoryId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OtherItem_ProductCategory_ProductCategoryCategoryId",
                table: "OtherItem");

            migrationBuilder.DropTable(
                name: "ProductCategory");

            migrationBuilder.DropIndex(
                name: "IX_OtherItem_ProductCategoryCategoryId",
                table: "OtherItem");

            migrationBuilder.DropColumn(
                name: "ProductCategoryCategoryId",
                table: "OtherItem");
        }
    }
}
