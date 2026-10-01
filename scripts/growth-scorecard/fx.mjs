// Intentionally no implicit conversion: mixed-currency amounts remain separate.
export function normalizeMoney(rows,targetCurrency){if(!rows.length||rows.some(r=>r.currency!==targetCurrency||r.status!=='READY'||r.value===null))return null;return rows.reduce((s,r)=>s+r.value,0);}
