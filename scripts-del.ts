import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const uid = '7bbb871d-dcad-495c-8b18-9d73bec6ef74';
const tables = ['profiles','consents','medical_conditions','medical_conditions_summary','hospital_stays','obstetric_history','prescription_medications','otc_supplements','stopped_medications','drug_intolerances','childhood_vaccines','travel_vaccines','other_vaccines','vaccination_contraindications','pairing_codes','audit_log','allergies_summary','allergy_drug_intolerances','beta_survey_responses','contrast_allergies','drug_allergies','environmental_allergies','food_allergies','heredity_conditions','heredity_genetic_testing','heredity_parents','heredity_siblings','heredity_summary','lifestyle_risk','pro_sessions','record_comments','record_entries','record_locations'];
for (const t of tables) { const { error } = await sb.from(t).delete().eq('user_id', uid); if (error) console.log(t, error.message); }
const { error } = await sb.auth.admin.deleteUser(uid);
console.log('delete user:', error?.message ?? 'ok');
