import {
  DataTable,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@stats47/components";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";


import type { ColumnDef } from "@tanstack/react-table";

interface TestRow {
  label: string;
}

const columns: ColumnDef<TestRow>[] = [
  {
    accessorKey: "label",
    header: "項目",
  },
];

describe("unified table density", () => {
  // 2026-10-27: 密度の正はテンプレート (shadcndashboard/next-shadcn-dashboard・Base UI) の table.tsx。
  // 旧 13px・36px 行 (text-[13px] / h-9 / py-1.5) はテンプレートの text-sm / h-10 / p-2 に置き換わった。
  it("Tableプリミティブがテンプレートの共通密度を持つ", () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>項目</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>人口</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );

    expect(screen.getByRole("table")).toHaveClass("text-sm");
    expect(screen.getByRole("columnheader")).toHaveClass(
      "h-10",
      "px-2",
    );
    expect(screen.getByRole("cell")).toHaveClass("p-2");
  });

  it("DataTableも同じTableプリミティブのセルを使う", () => {
    render(
      <DataTable
        columns={columns}
        data={[{ label: "国土・気象" }]}
        enableFiltering={false}
        enableSorting={false}
        showIndex={false}
        showRowCount={false}
      />,
    );

    expect(screen.getByRole("columnheader")).toHaveAttribute("data-slot", "table-head");
    expect(screen.getByRole("cell")).toHaveAttribute("data-slot", "table-cell");
    expect(screen.getByRole("columnheader")).toHaveClass(
      "h-10",
      "px-2",
    );
    expect(screen.getByRole("cell")).toHaveClass("p-2");
  });
});
