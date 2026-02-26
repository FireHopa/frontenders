export type AuthoritySignal = {
  id: string;
  label: string;
  points: number;
  hit: boolean;
};


export function authorityLabel(score: number): { label: string; tone: "red" | "yellow" | "green" | "blue" } {
  if (score >= 85) return { label: "Muito forte", tone: "green" };
  if (score >= 65) return { label: "Forte", tone: "blue" };
  if (score >= 45) return { label: "Médio", tone: "yellow" };
  return { label: "Fraco", tone: "red" };
}
