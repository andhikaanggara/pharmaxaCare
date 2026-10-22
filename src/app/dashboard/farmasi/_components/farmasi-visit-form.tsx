"use client";

import { useEffect, useMemo, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, differenceInDays, parseISO } from "date-fns";
import { toast } from "sonner";

// UTILS
import { formatRupiah, getCurrentShift, parseRupiah } from "@/lib/utils";

// SCHEMA
import { FarmasiVisitSchema, farmasiVisitSchema } from "../schema";

// UI COMP
import { DialogForm } from "@/components/dialog-form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";

type FarmasiVisitFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: FarmasiVisitSchema | null;
  staffOptions: { id: string; name: string; role: string }[];
  patientOptions: { id: string; name: string }[];
  visitOptions: { id: string; label: string }[];
};

const defaultValues: Partial<FarmasiVisitSchema> = {
  tanggal_dispensing: format(new Date(), "yyyy-MM-dd"),
  shift_dispensing: getCurrentShift(),
  poli: "Umum",
  penjamin: "Mandiri",
  penanganan: "Rawat Jalan",
  jenis_resep: "Biasa",
  metode_pembayaran: "Cash",
  nominal_terbayar: 0,
};

export function FarmasiVisitForm({
  open,
  onOpenChange,
  editData,
  staffOptions,
  patientOptions,
  visitOptions,
}: FarmasiVisitFormProps) {
  const isEditMode = !!editData;
  const [isPending, startTransition] = useTransition();

  const form = useForm<FarmasiVisitSchema>({
    resolver: zodResolver(farmasiVisitSchema),
    defaultValues: defaultValues as FarmasiVisitSchema,
  });

  // Watch fields for conditional logic
  const watchPenanganan = useWatch({
    control: form.control,
    name: "penanganan",
  });
  const watchTanggalDatang = useWatch({
    control: form.control,
    name: "tanggal_datang",
  });
  const watchTanggalPulang = useWatch({
    control: form.control,
    name: "tanggal_pulang",
  });

  const isInapOrHome =
    watchPenanganan === "Rawat Inap" || watchPenanganan === "Home Visit";

  // Auto-calculate lama perawatan
  useEffect(() => {
    if (isInapOrHome && watchTanggalDatang && watchTanggalPulang) {
      const start = parseISO(watchTanggalDatang);
      const end = parseISO(watchTanggalPulang);
      const diff = differenceInDays(end, start);
      form.setValue("lama_perawatan", Math.max(0, diff));
    }
  }, [watchTanggalDatang, watchTanggalPulang, isInapOrHome, form]);

  useEffect(() => {
    if (open) {
      if (editData) {
        form.reset(editData);
      } else {
        form.reset({
          ...defaultValues,
          tanggal_dispensing: format(new Date(), "yyyy-MM-dd"),
          shift_dispensing: getCurrentShift(),
        } as FarmasiVisitSchema);
      }
    }
  }, [editData, open, form]);

  const handleSubmit = (data: FarmasiVisitSchema) => {
    startTransition(async () => {
      try {
        console.log("Submitting Visit Data:", data);
        // Here you would call your server action
        toast.success(
          `Kunjungan berhasil ${isEditMode ? "diperbarui" : "ditambahkan"}`,
        );
        onOpenChange(false);
      } catch (error) {
        toast.error("Terjadi kesalahan sistem");
      }
    });
  };

  return (
    <DialogForm
      open={open}
      onOpenChange={onOpenChange}
      title={isEditMode ? "Edit Kunjungan Farmasi" : "Tambah Kunjungan Farmasi"}
      isPending={isPending}
      formId="form-farmasi-visit"
      isEditMode={isEditMode}
    >
      <form onSubmit={form.handleSubmit(handleSubmit)} id="form-farmasi-visit">
        <div className="flex flex-col gap-6 max-h-125 overflow-y-auto pb-2 pr-4">
          {/* SECTION 1: IDENTIFIKASI & WAKTU */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold border-b pb-2">
              Identifikasi & Waktu
            </h3>

            <FieldGroup className="grid grid-cols-2 gap-4">
              <Controller
                name="tanggal_dispensing"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Tgl Dispensing</FieldLabel>
                    <Input {...field} type="date" />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
              <Controller
                name="shift_dispensing"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Shift</FieldLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Shift" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pagi">Pagi</SelectItem>
                        <SelectItem value="Sore">Sore</SelectItem>
                        <SelectItem value="Malam">Malam</SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            </FieldGroup>

            <FieldGroup className="grid grid-cols-2 gap-4">
              <Controller
                name="id_staff_farmasi"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Staf Farmasi</FieldLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Staf" />
                      </SelectTrigger>
                      <SelectContent>
                        {staffOptions
                          .filter((s) =>
                            s.role.toLowerCase().includes("farmasi"),
                          )
                          .map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
              <Controller
                name="id_staff_apoteker"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Staf Apoteker</FieldLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Staf" />
                      </SelectTrigger>
                      <SelectContent>
                        {staffOptions
                          .filter((s) =>
                            s.role.toLowerCase().includes("apoteker"),
                          )
                          .map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            </FieldGroup>
            <Controller
              name="id_visit"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Cari Kunjungan</FieldLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Cari Kunjungan..." />
                    </SelectTrigger>
                    <SelectContent>
                      {patientOptions.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Controller
              name="id_patient"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Cari Nama Pasien</FieldLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Cari Pasien..." />
                    </SelectTrigger>
                    <SelectContent>
                      {patientOptions.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          </div>

          {/* SECTION 2: DATA KLINIS */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold border-b pb-2">Data Klinis</h3>

            <div className="grid grid-cols-3 gap-4">
              <Controller
                name="poli"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Poli</FieldLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Umum">Umum</SelectItem>
                        <SelectItem value="Gigi">Gigi</SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
              <Controller
                name="penjamin"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Penjamin</FieldLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Mandiri">Mandiri</SelectItem>
                        <SelectItem value="BPJS">BPJS</SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
              <Controller
                name="penanganan"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Penanganan</FieldLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Rawat Jalan">Rawat Jalan</SelectItem>
                        <SelectItem value="Rujukan">Rujukan</SelectItem>
                        <SelectItem value="Surat Sehat">Surat Sehat</SelectItem>
                        <SelectItem value="Copy Resep">Copy Resep</SelectItem>
                        <SelectItem value="Lab">Lab</SelectItem>
                        <SelectItem value="Observasi">Observasi</SelectItem>
                        <SelectItem value="Infus Vitamin">
                          Infus Vitamin
                        </SelectItem>
                        <SelectItem value="Rawat Inap">Rawat Inap</SelectItem>
                        <SelectItem value="Home Visit">Home Visit</SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            </div>
          </div>

          {/* SECTION 3: KONDISIONAL (RAWAT INAP / HOME VISIT) */}
          {isInapOrHome && (
            <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-1 gap-6 bg-muted/30 p-4 rounded-lg border border-dashed border-primary/20">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-primary">
                  Detail Rawat Inap / Home Visit
                </h3>
                <Controller
                  name="kamar"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Kamar / Lokasi</FieldLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Kamar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Anggrek">Anggrek</SelectItem>
                          <SelectItem value="Bougenvile">Bougenvile</SelectItem>
                          <SelectItem value="Cempaka">Cempaka</SelectItem>
                          <SelectItem value="Dahlia">Dahlia</SelectItem>
                          <SelectItem value="Rumah Pasien">
                            Rumah Pasien
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Controller
                    name="tanggal_datang"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Tgl Datang</FieldLabel>
                        <Input {...field} type="date" />
                        <FieldError errors={[fieldState.error]} />
                      </Field>
                    )}
                  />
                  <Controller
                    name="tanggal_pulang"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Tgl Pulang</FieldLabel>
                        <Input {...field} type="date" />
                        <FieldError errors={[fieldState.error]} />
                      </Field>
                    )}
                  />
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Controller
                      name="lama_perawatan"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>Lama Perawatan (Hari)</FieldLabel>
                          <Input
                            {...field}
                            type="number"
                            readOnly
                            className="bg-muted"
                          />
                          <FieldError errors={[fieldState.error]} />
                        </Field>
                      )}
                    />
                    <Controller
                      name="cara_pulang"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>Cara Pulang</FieldLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Sembuh">Sembuh</SelectItem>
                              <SelectItem value="APS">APS</SelectItem>
                              <SelectItem value="Meninggal">
                                Meninggal
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FieldError errors={[fieldState.error]} />
                        </Field>
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: TRANSAKSI */}
          <div className="col-span-1 md:col-span-2 space-y-4 border-t pt-4">
            <h3 className="text-sm font-semibold">Detail Transaksi</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Controller
                name="nominal_terbayar"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Nominal Terbayar</FieldLabel>
                    <Input
                      id="nominal_terbayar"
                      value={formatRupiah(field.value)}
                      onChange={(e) => {
                        const cleaned = parseRupiah(e.target.value);
                        field.onChange(cleaned);
                      }}
                      className="text-lg font-bold"
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
              <Controller
                name="metode_pembayaran"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Metode Pembayaran</FieldLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="BPJS">BPJS</SelectItem>
                        <SelectItem value="Transfer">Transfer</SelectItem>
                        <SelectItem value="QRIS">QRIS</SelectItem>
                        <SelectItem value="Tidak Bayar">Tidak Bayar</SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            </div>
          </div>
        </div>
      </form>
    </DialogForm>
  );
}
