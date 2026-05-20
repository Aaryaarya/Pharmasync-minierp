export default function StockBadge({ stock }) {
  const n = Number(stock);
  if (n === 0) return <span className="erp-pill-danger">Out of Stock</span>;
  if (n <= 10) return <span className="erp-pill-warning">Low Stock</span>;
  return <span className="erp-pill-success">In Stock</span>;
}
