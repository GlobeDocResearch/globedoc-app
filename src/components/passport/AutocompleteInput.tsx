import { useState } from "react";

export function AutocompleteInput({
  value,
  onChange,
  placeholder,
  suggestions,
  className,
  onKeyDown,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  suggestions: string[];
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  autoFocus?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const filtered = value
    ? suggestions.filter((s) => s.toLowerCase().includes(value.toLowerCase())).slice(0, 8)
    : [];
  return (
    <div className="relative">
      <input
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        className={
          className ??
          "mt-1 w-full rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#0D1B2A] placeholder:text-gray-400 focus:border-[#6BBF8E] focus:outline-none"
        }
      />

      {open && filtered.length > 0 && filtered[0].toLowerCase() !== value.toLowerCase() && (
        <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-md">
          {filtered.map((s) => (
            <li key={s}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(s);
                  setOpen(false);
                }}
                className="block w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100"
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export const COMMON_MEDICATIONS = [
  "Paracetamol",
  "Ibuprofen",
  "Aspirin",
  "Naproxen",
  "Diclofenac",
  "Codeine",
  "Tramadol",
  "Morphine",
  "Oxycodone",
  "Amoxicillin",
  "Penicillin V",
  "Flucloxacillin",
  "Doxycycline",
  "Azithromycin",
  "Erythromycin",
  "Ciprofloxacin",
  "Trimethoprim",
  "Nitrofurantoin",
  "Metronidazole",
  "Clarithromycin",
  "Metformin",
  "Insulin (long-acting)",
  "Insulin (rapid-acting)",
  "Glipizide",
  "Sitagliptin",
  "Empagliflozin",
  "Levothyroxine",
  "Liothyronine",
  "Lisinopril",
  "Ramipril",
  "Enalapril",
  "Losartan",
  "Candesartan",
  "Valsartan",
  "Amlodipine",
  "Felodipine",
  "Atenolol",
  "Bisoprolol",
  "Metoprolol",
  "Propranolol",
  "Carvedilol",
  "Furosemide",
  "Bendroflumethiazide",
  "Hydrochlorothiazide",
  "Spironolactone",
  "Warfarin",
  "Apixaban",
  "Rivaroxaban",
  "Dabigatran",
  "Clopidogrel",
  "Atorvastatin",
  "Simvastatin",
  "Rosuvastatin",
  "Pravastatin",
  "Omeprazole",
  "Esomeprazole",
  "Pantoprazole",
  "Lansoprazole",
  "Ranitidine",
  "Famotidine",
  "Salbutamol",
  "Terbutaline",
  "Budesonide",
  "Fluticasone",
  "Beclometasone",
  "Salmeterol",
  "Formoterol",
  "Montelukast",
  "Tiotropium",
  "Sertraline",
  "Citalopram",
  "Escitalopram",
  "Fluoxetine",
  "Paroxetine",
  "Venlafaxine",
  "Mirtazapine",
  "Duloxetine",
  "Bupropion",
  "Amitriptyline",
  "Nortriptyline",
  "Diazepam",
  "Lorazepam",
  "Oxazepam",
  "Zopiclone",
  "Zolpidem",
  "Melatonin",
  "Quetiapine",
  "Olanzapine",
  "Risperidone",
  "Aripiprazole",
  "Lithium",
  "Lamotrigine",
  "Valproate",
  "Carbamazepine",
  "Levetiracetam",
  "Gabapentin",
  "Pregabalin",
  "Methylphenidate",
  "Lisdexamfetamine",
  "Atomoxetine",
  "Hydroxychloroquine",
  "Methotrexate",
  "Prednisolone",
  "Hydrocortisone",
  "Cetirizine",
  "Loratadine",
  "Fexofenadine",
  "Desloratadine",
  "Tamsulosin",
  "Finasteride",
  "Sildenafil",
  "Tadalafil",
  "Levonorgestrel",
  "Ethinylestradiol/Levonorgestrel",
  "Drospirenone/Ethinylestradiol",
  "Norethisterone",
  "Estradiol",
  "Alendronate",
  "Denosumab",
  "Calcium + Vitamin D",
];

export const COMMON_SUPPLEMENTS = [
  "Vitamin D3",
  "Vitamin D + K2",
  "Vitamin B12",
  "Vitamin B complex",
  "Vitamin C",
  "Vitamin E",
  "Folic acid",
  "Multivitamin",
  "Iron",
  "Magnesium",
  "Zinc",
  "Calcium",
  "Calcium + Vitamin D",
  "Omega-3 (fish oil)",
  "Omega-3 (algae)",
  "Probiotics",
  "Coenzyme Q10",
  "Melatonin",
  "Glucosamine",
  "Chondroitin",
  "Turmeric / Curcumin",
  "Ashwagandha",
  "Echinacea",
  "Ginkgo biloba",
  "St John's Wort",
  "Valerian",
  "Psyllium husk",
  "Creatine",
  "Whey protein",
  "Collagen",
  "Biotin",
  "Selenium",
  "Iodine",
  "Potassium",
  "L-theanine",
  "5-HTP",
  "CBD oil",
];
