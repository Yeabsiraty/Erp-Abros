import { useState } from "react";
import { useToast } from "./hooks.jsx";

/** ቅጽ ሲላክ: busy ሁኔታ + ስኬት/ስህተት መልዕክት። ሲሳካ true ይመልሳል። */
export function useSubmit() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const run = async (fn, okMsg = "ተቀምጧል") => {
    setBusy(true);
    try {
      await fn();
      if (okMsg) toast(okMsg);
      return true;
    } catch (e) {
      toast(e.message, "err");
      return false;
    } finally {
      setBusy(false);
    }
  };
  return [busy, run];
}

export const num = (v) => (v === "" || v == null ? 0 : Number(v));
export const dateOf = (row) => ({ y: row.y, m: row.m, d: row.d });
