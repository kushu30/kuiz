export const normalize = (s: string) =>
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "").trim().toLowerCase();

export function checkTextAnswer(input: string, policy: any){
  const val = policy?.normalize === false
    ? (policy?.case_sensitive ? input.trim() : input.trim().toLowerCase())
    : normalize(input);

  const accepted = (policy?.accepted ?? []).map((a: string) =>
    policy?.normalize === false ? (policy?.case_sensitive ? a : a.toLowerCase()) : normalize(a)
  );
  if (accepted.includes(val)) return true;

  for (const rx of policy?.regex ?? []) {
    if (new RegExp(rx, policy?.case_sensitive ? "" : "i").test(input.trim())) return true;
  }
  return false;
}
