import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { authAction } from "@/utils/action";
import { parsePatientsFile } from "@/lib/parse-patients";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_ROWS = 500; // satu kali insert = atomik

const key = (name: string, birth: string) =>
  `${name.toLowerCase().replace(/\s+/g, " ").trim()}|${birth.slice(0, 10)}`;

// Supabase membatasi 1000 baris per query, jadi diambil per halaman
async function existingKeys(supabase: SupabaseClient) {
  const keys = new Set<string>();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("patients")
      .select("name, birth_date")
      .range(from, from + 999);
    if (error) throw new Error(error.message);
    for (const p of data ?? [])
      if (p.birth_date) keys.add(key(p.name, p.birth_date));
    if ((data ?? []).length < 1000) break;
  }
  return keys;
}

export async function POST(req: Request) {
  const result = await authAction(async ({ supabase, isGuest }) => {
    const form = await req.formData();
    const file = form.get("file");
    const dryRun = form.get("dryRun") === "true";

    if (!(file instanceof File)) throw new Error("File tidak ditemukan");
    if (!/\.(xlsx|xls|csv)$/i.test(file.name))
      throw new Error("Format harus .xlsx, .xls, atau .csv");
    if (file.size > MAX_BYTES) throw new Error("Ukuran file maksimal 5 MB");

    const { rows, errors, total } = parsePatientsFile(await file.arrayBuffer());
    if (total === 0) throw new Error("File kosong");
    if (total > MAX_ROWS)
      throw new Error(`Maksimal ${MAX_ROWS} baris per file`);

    // buang duplikat: sudah ada di database, atau berulang di dalam file
    const seen = await existingKeys(supabase);
    const fresh: typeof rows = [];
    let skipped = 0;
    for (const r of rows) {
      const k = key(r.data.name, r.data.birth_date);
      if (seen.has(k)) skipped++;
      else {
        seen.add(k);
        fresh.push(r);
      }
    }

    if (!dryRun && fresh.length > 0) {
      const { error } = await supabase
        .from("patients")
        .insert(fresh.map((r) => ({ ...r.data, is_demo: isGuest })));
      if (error) throw new Error(error.message);
      revalidatePath("/master-patients"); // sesuaikan dengan rute aslimu
      revalidatePath("/dashboard/visits");
    }

    return {
      total,
      valid: fresh.length,
      inserted: dryRun ? 0 : fresh.length,
      skipped,
      errors,
    };
  });

  return NextResponse.json(result, { status: "error" in result ? 400 : 200 });
}
