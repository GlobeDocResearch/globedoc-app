-- Erase all accounts and all associated user data
TRUNCATE TABLE
  public.allergies_summary,
  public.allergy_drug_intolerances,
  public.audit_log,
  public.beta_survey_responses,
  public.childhood_vaccines,
  public.consents,
  public.contrast_allergies,
  public.drug_allergies,
  public.drug_intolerances,
  public.environmental_allergies,
  public.food_allergies,
  public.heredity_conditions,
  public.heredity_genetic_testing,
  public.heredity_parents,
  public.heredity_siblings,
  public.heredity_summary,
  public.hospital_stays,
  public.lifestyle_risk,
  public.medical_conditions,
  public.medical_conditions_summary,
  public.obstetric_history,
  public.otc_supplements,
  public.other_vaccines,
  public.pairing_codes,
  public.prescription_medications,
  public.pro_sessions,
  public.profiles,
  public.record_comments,
  public.record_entries,
  public.record_locations,
  public.stopped_medications,
  public.travel_vaccines,
  public.vaccination_contraindications
RESTART IDENTITY CASCADE;

-- Delete all auth users (this cascades through auth.* schema)
DELETE FROM auth.users;