using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PharmaTrack.API.Migrations
{
    /// <inheritdoc />
    public partial class MakeSupplierOptional : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "SupplierId",
                table: "MedicineBatch",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.CreateIndex(
                name: "IX_MedicineBatch_SupplierId",
                table: "MedicineBatch",
                column: "SupplierId");

            migrationBuilder.AddForeignKey(
                name: "FK_MedicineBatch_Supplier_SupplierId",
                table: "MedicineBatch",
                column: "SupplierId",
                principalTable: "Supplier",
                principalColumn: "SupplierId",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MedicineBatch_Supplier_SupplierId",
                table: "MedicineBatch");

            migrationBuilder.DropIndex(
                name: "IX_MedicineBatch_SupplierId",
                table: "MedicineBatch");

            migrationBuilder.AlterColumn<int>(
                name: "SupplierId",
                table: "MedicineBatch",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);
        }
    }
}
