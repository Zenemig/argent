"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useLiveQuery } from "dexie-react-hooks";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { METERING_MODES } from "@/lib/constants";
import { useUserId } from "@/hooks/useUserId";
import { useUserTier } from "@/hooks/useUserTier";
import { getSetting, setSetting, applyTheme } from "@/lib/settings-helpers";
import { createClient } from "@/lib/supabase/client";
import { UpgradePrompt } from "@/components/upgrade-prompt";
import { getLocalAvatar, setLocalAvatar, uploadAvatar } from "@/lib/avatar";
import { getUserAvatar, type AvatarIcon } from "@/lib/user-avatar";
import { Camera as CameraIcon, Aperture, Film as FilmIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { captureImage } from "@/lib/image-capture";
import { toast } from "sonner";
import { DeleteAccountSection } from "./delete-account-section";

const AVATAR_ICON_MAP = {
  camera: CameraIcon,
  aperture: Aperture,
  film: FilmIcon,
} as const satisfies Record<AvatarIcon, typeof CameraIcon>;

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-8 text-xs font-medium uppercase tracking-wider text-muted-foreground">
      {children}
    </h2>
  );
}

function SettingRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}

export function SettingsContent() {
  const t = useTranslations("settings");
  const tUpgrade = useTranslations("upgrade");
  const userId = useUserId();
  const { tier, isProUser, isAuthenticated } = useUserTier();

  const [theme, setTheme] = useState("dark");
  const [displayName, setDisplayName] = useState("");
  const [copyright, setCopyright] = useState("");
  const [defaultMetering, setDefaultMetering] = useState("__none__");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Check auth state on mount
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email ?? null);
    });
  }, []);

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

  // Load avatar (scoped to user)
  useEffect(() => {
    if (!userId) return;
    getLocalAvatar(userId).then((blob) => {
      if (blob) {
        setAvatarUrl(URL.createObjectURL(blob));
      }
    });
  }, [userId]);

  const cameras = useLiveQuery(
    () => {
      if (userId === undefined) return undefined as never;
      return db.cameras
        .where("user_id")
        .equals(userId!)
        .filter((c) => c.deleted_at === null || c.deleted_at === undefined)
        .toArray();
    },
    [userId],
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

  async function handleAvatarChange() {
    try {
      // captureImage is statically imported — dynamic import here would break
      // the iOS Safari user-gesture chain before input.click().
      const result = await captureImage(256, 0.8);
      if ("error" in result) {
        if (result.error !== "no_file") {
          toast.error(t("avatarError"));
        }
        return;
      }

      // Save locally
      await setLocalAvatar(userId!, result.blob);
      if (avatarUrl) URL.revokeObjectURL(avatarUrl);
      setAvatarUrl(URL.createObjectURL(result.blob));

      // Attempt upload if online
      if (userId && navigator.onLine) {
        setIsUploadingAvatar(true);
        try {
          const supabase = createClient();
          const path = await uploadAvatar(supabase, userId, result.blob);
          if (path) {
            await setSetting("avatarUploaded", "true");
          } else {
            await setSetting("avatarUploaded", "false");
          }
        } finally {
          setIsUploadingAvatar(false);
        }
      } else {
        await setSetting("avatarUploaded", "false");
      }

      toast.success(t("saved"));
    } catch {
      toast.error(t("avatarError"));
    }
  }

  const saveField = useCallback(
    (key: string, value: string) => {
      setSetting(key, value);
      toast.success(t("saved"));
    },
    [t],
  );

  return (
    <div className="space-y-6 lg:max-w-2xl">
      {/* Profile header */}
      {userEmail && (
        <>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleAvatarChange}
              disabled={isUploadingAvatar}
              aria-label={t("changeAvatar")}
              className={cn(
                "group relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                !avatarUrl && (userId ? getUserAvatar(userId).bgColor : "bg-muted"),
              )}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                (() => {
                  const avatar = userId ? getUserAvatar(userId) : null;
                  const IconComp = avatar ? AVATAR_ICON_MAP[avatar.icon] : CameraIcon;
                  return (
                    <IconComp
                      className={cn(
                        "h-6 w-6",
                        avatar ? avatar.iconColor : "text-muted-foreground",
                      )}
                    />
                  );
                })()
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <CameraIcon className="h-5 w-5 text-white" />
              </div>
            </button>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{userEmail}</p>
              <Badge variant={isProUser ? "default" : "secondary"}>
                {isProUser ? t("tierPro") : t("tierFree")}
              </Badge>
            </div>
          </div>

          <div>
            {isProUser ? (
              <p className="text-sm text-muted-foreground">
                {tUpgrade("proManageHint")}
              </p>
            ) : (
              <UpgradePrompt />
            )}
          </div>

        </>
      )}

      {/* Preferences section */}
      <div>
        <SectionHeader>{t("preferences")}</SectionHeader>
        <div className="mt-3">
          <SettingRow label={t("language")}>
            <Select defaultValue="en" onValueChange={handleLanguageChange}>
              <SelectTrigger aria-label={t("language")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">{t("english")}</SelectItem>
                <SelectItem value="es">{t("spanish")}</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>

          <SettingRow label={t("theme")}>
            <Select value={theme} onValueChange={handleThemeChange}>
              <SelectTrigger aria-label={t("theme")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dark">{t("themeDark")}</SelectItem>
                <SelectItem value="light">{t("themeLight")}</SelectItem>
                <SelectItem value="system">{t("themeSystem")}</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>

          <SettingRow label={t("defaultMetering")}>
            <Select
              value={defaultMetering}
              onValueChange={(v) => {
                setDefaultMetering(v);
                saveField("defaultMetering", v);
              }}
            >
              <SelectTrigger aria-label={t("defaultMetering")}>
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
          </SettingRow>

          {cameras && cameras.length > 0 && (
            <SettingRow label={t("defaultCamera")}>
              <Select
                value={defaultCamera}
                onValueChange={(v) => {
                  setDefaultCamera(v);
                  saveField("defaultCamera", v);
                }}
              >
                <SelectTrigger aria-label={t("defaultCamera")}>
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
            </SettingRow>
          )}
        </div>
      </div>

      {/* Metadata section */}
      <div>
        <SectionHeader>{t("metadata")}</SectionHeader>
        <div className="mt-3">
          <SettingRow label={t("displayName")}>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              onBlur={() => saveField("displayName", displayName)}
              placeholder={t("displayName")}
            />
          </SettingRow>

          <SettingRow label={t("copyright")}>
            <Input
              value={copyright}
              onChange={(e) => setCopyright(e.target.value)}
              onBlur={() => saveField("copyright", copyright)}
              placeholder="© 2026 Your Name"
            />
          </SettingRow>
        </div>
      </div>

      {/* Danger Zone */}
      {userEmail && (
        <div>
          <SectionHeader>{t("dangerZone")}</SectionHeader>
          <DeleteAccountSection />
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        {t("about")} · {t("version")} 0.1.0
      </p>
    </div>
  );
}
