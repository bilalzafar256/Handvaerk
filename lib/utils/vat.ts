const VAT_RATE = 0.25 // 25% Danish moms

export function calcVat(exVat: number): number {
  return exVat * VAT_RATE
}

export function calcInclVat(exVat: number): number {
  return exVat * (1 + VAT_RATE)
}

export function calcExVat(inclVat: number): number {
  return inclVat / (1 + VAT_RATE)
}
