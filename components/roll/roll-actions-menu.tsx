"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { MoreVertical, AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { syncUpdate } from "@/lib/sync-write";
import type { Roll } from "@/lib/types";
import { DiscardRollDialog } from "./discard-roll-dialog";
import { toast } from "sonner";

interface RollActionsMenuProps {
  roll: Roll;
  frameCount: number;
}

export function RollActionsMenu({ roll, frameCount }: RollActionsMenuProps) {
  const t = useTranslations("roll");
  const tc = useTranslations("common");
  const router = useRouter();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  async function handleDelete() {
    await syncUpdate("rolls", roll.id, {
      deleted_at: Date.now(),
      updated_at: Date.now(),
    });
    toast.success(t("rollDeleted"));
    router.push("/");
  }

  const isDiscarded = roll.status === "discarded";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!isDiscarded && (
            <DropdownMenuItem onClick={() => setShowDiscardDialog(true)}>
              <AlertTriangle className="mr-2 h-4 w-4" />
              {t("discardRoll")}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {t("deleteRoll")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteConfirm")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteWarning", { count: frameCount })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              {tc("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DiscardRollDialog
        open={showDiscardDialog}
        onOpenChange={setShowDiscardDialog}
        rollId={roll.id}
      />
    </>
  );
}
