using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PharmaTrack.API.Migrations
{
    /// <inheritdoc />
    public partial class FixOtherItemProductCategory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OtherItem_ProductCategory_ProductCategoryCategoryId",
                table: "OtherItem");

            migrationBuilder.RenameColumn(
                name: "ProductCategoryCategoryId",
                table: "OtherItem",
                newName: "ProductCategoryId");

            migrationBuilder.RenameIndex(
                name: "IX_OtherItem_ProductCategoryCategoryId",
                table: "OtherItem",
                newName: "IX_OtherItem_ProductCategoryId");

            migrationBuilder.AddForeignKey(
                name: "FK_OtherItem_ProductCategory_ProductCategoryId",
                table: "OtherItem",
                column: "ProductCategoryId",
                principalTable: "ProductCategory",
                principalColumn: "CategoryId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OtherItem_ProductCategory_ProductCategoryId",
                table: "OtherItem");

            migrationBuilder.RenameColumn(
                name: "ProductCategoryId",
                table: "OtherItem",
                newName: "ProductCategoryCategoryId");

            migrationBuilder.RenameIndex(
                name: "IX_OtherItem_ProductCategoryId",
                table: "OtherItem",
                newName: "IX_OtherItem_ProductCategoryCategoryId");

            migrationBuilder.AddForeignKey(
                name: "FK_OtherItem_ProductCategory_ProductCategoryCategoryId",
                table: "OtherItem",
                column: "ProductCategoryCategoryId",
                principalTable: "ProductCategory",
                principalColumn: "CategoryId");
        }
    }
}
