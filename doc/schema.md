TABLE roles (
id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
name VARCHAR(255) NOT NULL,
is_active BOOLEAN,
is_demo BOOLEAN
)

TABLE staff (
id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
name VARCHAR(255) NOT NULL,
role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
is_demo BOOLEAN
);

TABLE patients (
id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
name VARCHAR(255) NOT NULL,
gender VARCHAR(20) NOT NULL, -- male / female
birth_date DATE NOT NULL,
address TEXT,
phone VARCHAR(20),
patient_group VARCHAR(100),
is_new BOOLEAN DEFAULT TRUE,
created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

TABLE treatments (
id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
name VARCHAR(255) NOT NULL,
created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

TABLE diagnoses (
id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
code VARCHAR(10) NOT NULL UNIQUE,
name VARCHAR(255) NOT NULL,
created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

====

TABLE visits (
id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
department VARCHAR(100), -- poli (umum, gigi)
guarantor VARCHAR(100), -- penjamin (umum/bpjs)
diagnosis TEXT,
room VARCHAR(100), -- kamar(Anggrek, Bougenville, Cempaka, Dahlia, Edelweis)
admission_date TIMESTAMP WITH TIME ZONE NOT NULL, -- tanggal masuk
admission_shift VARCHAR(50), -- shift masuk (Pagi, Sore, Malam)
discharge_date TIMESTAMP WITH TIME ZONE, -- tanggal pulang
discharge_shift VARCHAR(50), -- shift pulang (Pagi, Sore, Malam)
registration_staff_id UUID REFERENCES staff(id), -- id staf
is_demo BOOLEAN DEFAULT TRUE
);

TABLE visit_treatments (
id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
visit_id UUID REFERENCES visits(id) ON DELETE CASCADE,
treatment_id UUID REFERENCES treatments(id),
operator_staff_id UUID REFERENCES staff(id), -- dokter/perawat yg menindak
assistant_staff_id UUID REFERENCES staff(id), -- asisten (bisa null jika tidak ada)
treatment_date TIMESTAMP WITH TIME ZONE NOT NULL, -- [BARU] Tanggal tindakan
treatment_shift VARCHAR(50) NOT NULL, -- [BARU] Shift tindakan (Pagi, Sore, Malam)
is_demo BOOLEAN DEFAULT TRUE
);

TABLE visit_prescriptions (
id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
visit_id UUID REFERENCES visits(id) ON DELETE CASCADE,
prescription_type VARCHAR(100), -- jenis resep (umum, bpjs, racikan)
pharmacist_staff_id UUID REFERENCES staff(id), -- id staf farmasi
dispensing_date DATE NOT NULL, -- tanggal penyiapan/dispensing resep
dispensing_shift VARCHAR(50) NOT NULL, -- shift dispensing (Pagi, Sore, Malam)
is_demo BOOLEAN DEFAULT TRUE,
);

TABLE visit_payments (
id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
visit_id UUID REFERENCES visits(id) ON DELETE SET NULL, -- opsional untuk beli obat tanpa kunjungan
amount NUMERIC(12, 2) NOT NULL, -- nominal (format rupiah: Rp x.xxx.xxx)
payment_method VARCHAR(50), -- cara bayar (cash, transfer, Qris, BPJS, Tidak bayar)
payment_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
payment_shift VARCHAR(50) NOT NULL, -- shift bayar (Pagi, Sore, Malam)
cashier_staff_id UUID REFERENCES staff(id), -- id staf
is_demo BOOLEAN DEFAULT TRUE,
);

TABLE attendances (
id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
date DATE NOT NULL,
shift VARCHAR(50) NOT NULL, -- Pagi, Sore, Malam
staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
is_demo BOOLEAN DEFAULT TRUE,
);

====
