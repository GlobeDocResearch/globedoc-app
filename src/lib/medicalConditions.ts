export const TOP_CONDITIONS: string[] = [
  "Type 1 diabetes",
  "Type 2 diabetes",
  "Hypertension",
  "Asthma",
  "COPD",
  "Coronary artery disease",
  "Heart failure",
  "Atrial fibrillation",
  "Stroke / TIA",
  "Depression",
  "Anxiety disorder",
  "Hypothyroidism",
  "Rheumatoid arthritis",
  "Osteoarthritis",
  "Chronic kidney disease",
  "Epilepsy",
  "Parkinson's disease",
  "Multiple sclerosis",
  "Crohn's disease / Ulcerative colitis",
  "Cancer (specify type)",
];

export const CONDITION_GROUPS: { specialty: string; items: string[] }[] = [
  {
    specialty: "Cardiology",
    items: [
      "Heart attack (MI)", "Angina", "Heart failure", "Atrial fibrillation",
      "Other arrhythmia", "Heart valve disease", "Congenital heart defect",
      "Cardiomyopathy", "Pericarditis", "Deep vein thrombosis",
      "Pulmonary embolism", "Peripheral artery disease", "Aortic aneurysm",
      "Hypertension",
    ],
  },
  {
    specialty: "Neurology",
    items: [
      "Stroke / TIA", "Epilepsy", "Migraine", "Multiple sclerosis",
      "Parkinson's disease", "Alzheimer's / Dementia", "Brain tumour",
      "Peripheral neuropathy", "Myasthenia gravis", "ALS", "Guillain-Barré",
      "Vertigo / Ménière's", "Narcolepsy",
    ],
  },
  {
    specialty: "Psychiatry",
    items: [
      "Depression", "Bipolar disorder", "Generalised anxiety", "Panic disorder",
      "PTSD", "OCD", "ADHD / ADD", "Autism spectrum", "Schizophrenia / Psychosis",
      "Eating disorder", "Personality disorder", "Substance use disorder",
      "Sleep disorder",
    ],
  },
  {
    specialty: "Pulmonology",
    items: [
      "Asthma", "COPD", "Chronic bronchitis", "Recurrent pneumonia",
      "Pleural effusion", "Pneumothorax", "Pulmonary fibrosis", "Lung cancer",
      "Sleep apnoea", "Sarcoidosis", "Cystic fibrosis", "Pulmonary hypertension",
    ],
  },
  {
    specialty: "Gastroenterology",
    items: [
      "Peptic ulcer", "GERD / Reflux", "Crohn's disease", "Ulcerative colitis",
      "IBS", "Coeliac disease", "Liver cirrhosis", "Chronic hepatitis B/C",
      "Fatty liver (NAFLD)", "Gallstones", "Pancreatitis", "Colorectal cancer",
    ],
  },
  {
    specialty: "Endocrinology",
    items: [
      "Type 1 diabetes", "Type 2 diabetes", "Prediabetes", "Hypothyroidism",
      "Hyperthyroidism / Graves'", "Thyroid cancer", "Addison's disease",
      "Cushing's syndrome", "Hyperparathyroidism", "Obesity (BMI ≥30)",
      "Metabolic syndrome", "High cholesterol / Dyslipidaemia", "Gout",
    ],
  },
  {
    specialty: "Nephrology & Urology",
    items: [
      "Chronic kidney disease", "Kidney transplant", "Dialysis", "Kidney stones",
      "Recurrent UTI", "Glomerulonephritis", "Urinary incontinence", "BPH",
      "Prostate cancer", "Bladder cancer",
    ],
  },
  {
    specialty: "Rheumatology",
    items: [
      "Rheumatoid arthritis", "SLE (Lupus)", "Sjögren's syndrome",
      "Psoriatic arthritis", "Ankylosing spondylitis", "Scleroderma",
      "Polymyalgia rheumatica", "Giant cell arteritis", "Vasculitis",
      "Fibromyalgia", "Gout",
    ],
  },
  {
    specialty: "Orthopaedics",
    items: [
      "Hip osteoarthritis", "Knee osteoarthritis", "Spinal osteoarthritis",
      "Scoliosis", "Disc herniation", "Spinal stenosis", "Osteoporosis",
      "Carpal tunnel syndrome", "Rotator cuff injury",
      "Chronic back / neck pain",
    ],
  },
  {
    specialty: "Dermatology",
    items: [
      "Psoriasis", "Atopic eczema", "Melanoma", "Basal / squamous cell cancer",
      "Rosacea", "Chronic urticaria", "Vitiligo", "Chronic wounds",
    ],
  },
  {
    specialty: "Ophthalmology",
    items: [
      "Cataract", "Glaucoma", "Macular degeneration", "Diabetic retinopathy",
      "Retinal detachment", "Dry eye disease", "Uveitis",
    ],
  },
  {
    specialty: "ENT",
    items: [
      "Chronic otitis", "Hearing loss", "Tinnitus", "Ménière's disease",
      "Chronic sinusitis", "Nasal polyps", "Tonsillectomy",
      "Snoring / Sleep apnoea", "Head & neck cancer",
    ],
  },
  {
    specialty: "Gynaecology",
    items: [
      "Endometriosis", "PCOS", "Uterine fibroids", "Cervical cancer / CIN",
      "Ovarian cancer", "Uterine cancer", "Breast cancer", "Prolapse",
      "Menstrual disorder", "Menopause symptoms", "Infertility / IVF",
    ],
  },
  {
    specialty: "Urology & Male reproductive",
    items: [
      "Prostate cancer", "BPH", "Prostatitis", "Testicular cancer",
      "Erectile dysfunction", "Vasectomy",
    ],
  },
  {
    specialty: "Oncology",
    items: [
      "Cancer — not listed above (specify)", "Radiotherapy", "Chemotherapy",
      "Immunotherapy", "Hormone therapy", "Bone marrow transplant",
      "In remission", "Palliative care",
    ],
  },
  {
    specialty: "Haematology",
    items: [
      "Anaemia", "Leukaemia", "Lymphoma", "Myeloma", "Haemophilia",
      "Thrombocytopenia", "Thrombophilia", "HIV / AIDS",
      "Primary immunodeficiency", "Stem cell transplant",
    ],
  },
  {
    specialty: "Infectious disease",
    items: [
      "Tuberculosis", "HIV", "Chronic hepatitis B", "Chronic hepatitis C",
      "Malaria", "Dengue", "Sepsis", "Infective endocarditis",
      "Meningitis / Encephalitis", "Chronic Lyme disease",
    ],
  },
  {
    specialty: "Immunology & Autoimmune",
    items: [
      "Primary immunodeficiency", "Autoimmune hepatitis",
      "Hashimoto's thyroiditis", "Antiphospholipid syndrome",
      "Immunosuppressed", "Chronic angioedema (HAE)",
    ],
  },
  {
    specialty: "Metabolic & Genetic",
    items: [
      "Haemochromatosis", "Alpha-1 antitrypsin deficiency", "Wilson's disease",
      "Cystic fibrosis", "Marfan syndrome", "Ehlers-Danlos syndrome",
      "Phenylketonuria", "Down syndrome / chromosomal condition",
      "Other congenital condition",
    ],
  },
  {
    specialty: "Chronic pain",
    items: [
      "CRPS", "Central sensitisation", "Neuropathic pain",
      "Trigeminal neuralgia", "Long-term opioid treatment",
    ],
  },
  {
    specialty: "Sleep disorders",
    items: [
      "Obstructive sleep apnoea", "Central sleep apnoea", "Restless legs",
      "Narcolepsy", "Circadian rhythm disorder",
    ],
  },
  {
    specialty: "Dentistry & Jaw",
    items: [
      "TMJ disorder", "Severe periodontitis", "Oral cancer / leukoplakia",
      "Jaw fracture / reconstruction",
    ],
  },
  {
    specialty: "Paediatric / Childhood",
    items: [
      "Prematurity", "Neonatal hypoxia", "Congenital heart defect",
      "Cerebral palsy", "Spina bifida", "Growth hormone deficiency",
      "Chronic childhood illness (specify)",
    ],
  },
  {
    specialty: "Other / Unclassified",
    items: [
      "ME / CFS", "Long Covid", "Amyloidosis", "Sarcoidosis", "Mastocytosis",
      "Other chronic condition (specify)",
    ],
  },
];

export const ALL_CONDITIONS: string[] = Array.from(
  new Set([
    ...TOP_CONDITIONS,
    ...CONDITION_GROUPS.flatMap((g) => g.items),
  ]),
);
