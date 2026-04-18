import { useState } from "react";
import { Plus, MoreHorizontal } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { t, formatCurrency } from "@/lib/i18n";

const PRODUCTS = [
  { id: "1", name: "Cappuccino", category: "Koffie", price: 3.5, vat: 9, stock: "—" },
  { id: "2", name: "Tosti ham/kaas", category: "Lunch", price: 6.5, vat: 9, stock: "—" },
  { id: "3", name: "Appeltaart", category: "Gebak", price: 4.5, vat: 9, stock: 18 },
  { id: "4", name: "Bier tap 25cl", category: "Drank", price: 4.2, vat: 21, stock: "—" },
  { id: "5", name: "Spa rood 33cl", category: "Drank", price: 2.5, vat: 9, stock: 64 },
  { id: "6", name: "Glas wijn", category: "Drank", price: 5.5, vat: 21, stock: "—" },
];

export default function Products() {
  const tr = t();
  const [open, setOpen] = useState(false);

  return (
    <>
      <PageHeader
        title={tr.products.title}
        subtitle={tr.products.subtitle}
        action={
          <Button onClick={() => setOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            {tr.products.newProduct}
          </Button>
        }
      />

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tr.products.name}</TableHead>
              <TableHead>{tr.products.category}</TableHead>
              <TableHead className="text-right">{tr.products.price}</TableHead>
              <TableHead className="text-right">{tr.products.vat}</TableHead>
              <TableHead className="text-right">{tr.products.stock}</TableHead>
              <TableHead className="w-12 text-right">{tr.common.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {PRODUCTS.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="font-normal">
                    {p.category}
                  </Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums">{formatCurrency(p.price)}</TableCell>
                <TableCell className="text-right tabular-nums">{p.vat}%</TableCell>
                <TableCell className="text-right tabular-nums">{p.stock}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{tr.products.drawerTitle}</SheetTitle>
            <SheetDescription>{tr.products.drawerSubtitle}</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="p-name">{tr.products.name}</Label>
              <Input id="p-name" placeholder="Cappuccino" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-cat">{tr.products.category}</Label>
              <Input id="p-cat" placeholder="Koffie" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="p-price">{tr.products.price} (€)</Label>
                <Input id="p-price" type="number" step="0.01" placeholder="3.50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-vat">{tr.products.vat} (%)</Label>
                <Input id="p-vat" type="number" placeholder="9" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-stock">{tr.products.stock}</Label>
              <Input id="p-stock" type="number" placeholder="—" />
            </div>
          </div>
          <SheetFooter className="mt-6 gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              {tr.common.cancel}
            </Button>
            <Button onClick={() => setOpen(false)}>{tr.common.save}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
