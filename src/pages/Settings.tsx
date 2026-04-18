import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";

export default function Settings() {
  const tr = t();
  return (
    <>
      <PageHeader title={tr.settings.title} subtitle={tr.settings.subtitle} />

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">{tr.settings.tabs.general}</TabsTrigger>
          <TabsTrigger value="tax">{tr.settings.tabs.tax}</TabsTrigger>
          <TabsTrigger value="printer">{tr.settings.tabs.printer}</TabsTrigger>
          <TabsTrigger value="integrations">{tr.settings.tabs.integrations}</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{tr.settings.company}</Label>
                  <Input defaultValue="Brouwcafé De Hoek B.V." />
                </div>
                <div className="space-y-2">
                  <Label>{tr.settings.vat}</Label>
                  <Input defaultValue="NL854321987B01" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{tr.settings.address}</Label>
                <Textarea defaultValue={"Hoofdstraat 12\n1012 AB Amsterdam"} />
              </div>
              <div className="flex justify-end">
                <Button>{tr.common.save}</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tax">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <Label>{tr.settings.vatRates}</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-border p-3">
                  <p className="text-sm text-muted-foreground">Laag</p>
                  <p className="text-2xl font-semibold">9%</p>
                </div>
                <div className="rounded-md border border-border p-3">
                  <p className="text-sm text-muted-foreground">Hoog</p>
                  <p className="text-2xl font-semibold">21%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="printer">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{tr.settings.printerName}</Label>
                  <Input placeholder="Bar-printer" />
                </div>
                <div className="space-y-2">
                  <Label>{tr.settings.printerIp}</Label>
                  <Input placeholder="192.168.1.50" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button>{tr.common.save}</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <Card>
            <CardContent className="pt-6">
              <div className="rounded-md border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
                {tr.settings.integrationsEmpty}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
