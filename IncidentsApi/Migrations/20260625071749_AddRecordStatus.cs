using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IncidentsApi.Migrations
{
    /// <inheritdoc />
    public partial class AddRecordStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "RecordStatus",
                table: "Incidents",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RecordStatus",
                table: "Incidents");
        }
    }
}
