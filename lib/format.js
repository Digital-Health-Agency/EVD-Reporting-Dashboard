export const fmt = (n) => (typeof n === "number" ? n.toLocaleString() : "--");
export const pct = (n) => `${(n * 100).toFixed(1)}%`;
export const splitText = (obj) => `M ${fmt(obj.male)} | F ${fmt(obj.female)}`;
