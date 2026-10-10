// CSV for Excel in Brazil (004-AC8): UTF-8 with BOM, ";" separator (Excel pt-BR uses
// "," as the decimal mark), CRLF line endings, RFC 4180 quoting.
export type Cell = string | number | boolean | null | undefined;

function cell(value: Cell): string {
  if (value === null || value === undefined) return "";
  const text =
    typeof value === "number"
      ? value.toLocaleString("pt-BR", { maximumFractionDigits: 2 })
      : String(value);
  return /[;"\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(rows: Cell[][]): string {
  return "﻿" + rows.map((row) => row.map(cell).join(";")).join("\r\n") + "\r\n";
}

export function csvResponse(filename: string, rows: Cell[][]): Response {
  return new Response(toCsv(rows), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}
