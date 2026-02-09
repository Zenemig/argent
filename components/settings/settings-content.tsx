"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useLiveQuery } from "dexie-react-hooks";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { db } from "@/lib/db";
import { METERING_MODES } from "@/lib/constants";
import { GUEST_USER_ID } from "@/lib/guest";
import { getSetting, setSetting, applyTheme } from "@/lib/settings-helpers";
import { toast } from "sonner";

export function SettingsContent() {
  const t = useTranslations("settings");

  const [theme, setTheme] = useState("dark");
  const [displayName, setDisplayName] = useState("");
  const [copyright, setCopyright] = useState("");
  const [defaultMetering, setDefaultMetering] = useState("__none__");

  // Load settings
  useEffect(() => {
    async function load() {
      const t = await getSetting("theme");
      if (t) setTheme(t);
      const dn = await getSetting("displayName");
      if (dn) setDisplayName(dn);
      const cr = await getSetting("copyright");
      if (cr) setCopyright(cr);
      const dm = await getSetting("defaultMetering");
      setDefaultMetering(dm || "__none__");
    }
    load();
  }, []);

  const cameras = useLiveQuery(
    () =>
      db.cameras
        .where("user_id")
        .equals(GUEST_USER_ID)
        .filter((c) => c.deleted_at === null || c.deleted_at === undefined)
        .toArray(),
    [],
  );

  const [defaultCamera, setDefaultCamera] = useState("__none__");

  useEffect(() => {
    getSetting("defaultCamera").then((v) => {
      setDefaultCamera(v || "__none__");
    });
  }, []);

  function handleThemeChange(value: string) {
    setTheme(value);
    setSetting("theme", value);
    applyTheme(
      value,
      document.documentElement,
      window.matchMedia("(prefers-color-scheme: dark)"),
    );
    toast.success(t("saved"));
  }

  function handleLanguageChange(value: string) {
    document.cookie = `NEXT_LOCALE=${value};path=/;max-age=31536000`;
    window.location.reload();
  }

  const saveField = useCallback(
    (key: string, value: string) => {
      setSetting(key, value);
      toast.success(t("saved"));
    },
    [t],
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("language")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Select defaultValue="en" onValueChange={handleLanguageChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">{t("english")}</SelectItem>
              <SelectItem value="es">{t("spanish")}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("theme")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={theme} onValueChange={handleThemeChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dark">{t("themeDark")}</SelectItem>
              <SelectItem value="light">{t("themeLight")}</SelectItem>
              <SelectItem value="system">{t("themeSystem")}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("defaultMetering")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={defaultMetering}
            onValueChange={(v) => {
              setDefaultMetering(v);
              saveField("defaultMetering", v);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("none")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">{t("none")}</SelectItem>
              {METERING_MODES.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {cameras && cameras.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("defaultCamera")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={defaultCamera}
              onValueChange={(v) => {
                setDefaultCamera(v);
                saveField("defaultCamera", v);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("none")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{t("none")}</SelectItem>
                {cameras.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("displayName")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            onBlur={() => saveField("displayName", displayName)}
            placeholder={t("displayName")}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("copyright")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            value={copyright}
            onChange={(e) => setCopyright(e.target.value)}
            onBlur={() => saveField("copyright", copyright)}
            placeholder="© 2026 Your Name"
          />
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("about")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t("version")} 0.1.0
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
