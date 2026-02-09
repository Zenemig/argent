"use client";

import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CameraList } from "./camera-list";
import { LensList } from "./lens-list";
import { FilmCatalog } from "./film-catalog";

export function GearTabs() {
  const t = useTranslations("gear");

  return (
    <Tabs defaultValue="cameras" className="w-full">
      <TabsList className="w-full">
        <TabsTrigger value="cameras" className="flex-1">
          {t("cameras")}
        </TabsTrigger>
        <TabsTrigger value="lenses" className="flex-1">
          {t("lenses")}
        </TabsTrigger>
        <TabsTrigger value="films" className="flex-1">
          {t("films")}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="cameras">
        <CameraList />
      </TabsContent>
      <TabsContent value="lenses">
        <LensList />
      </TabsContent>
      <TabsContent value="films">
        <FilmCatalog />
      </TabsContent>
    </Tabs>
  );
}
