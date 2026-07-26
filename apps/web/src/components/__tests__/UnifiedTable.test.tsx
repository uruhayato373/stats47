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
  it("Tableプリミティブが13px・36px行の共通密度を持つ", () => {
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

    expect(screen.getByRole("table")).toHaveClass("text-[13px]");
    expect(screen.getByRole("columnheader")).toHaveClass(
      "h-9",
      "px-2",
      "py-1.5",
      "text-xs",
    );
    expect(screen.getByRole("cell")).toHaveClass(
      "h-9",
      "px-2",
      "py-1.5",
      "text-[13px]",
    );
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

    expect(screen.getByRole("columnheader")).toHaveClass(
      "h-9",
      "px-2",
      "py-1.5",
      "text-xs",
    );
    expect(screen.getByRole("cell")).toHaveClass(
      "h-9",
      "px-2",
      "py-1.5",
      "text-[13px]",
    );
  });
});
