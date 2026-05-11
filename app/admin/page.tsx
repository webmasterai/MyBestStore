import Link from "next/link";

function getAdminUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_MEDUSA_ADMIN_URL;
  if (fromEnv) return fromEnv;

  const backend = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "";
  if (!backend) return "http://localhost:9000/app";
  return `${backend.replace(/\/$/, "")}/app`;
}

export default function AdminPage() {
  const adminUrl = getAdminUrl();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
        Admin Workflows
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-foreground/70">
        Product/category CRUD, pricing, inventory, and order operations are enabled through
        My Best Store. Homepage hero/category promo content is editable in this frontend
        portal and persisted into My Best Store store metadata.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Link
          href="/admin/products"
          className="rounded-2xl border border-foreground/10 bg-background p-5 shadow-sm"
        >
          <h2 className="text-lg font-semibold">In-App Product CRUD</h2>
          <p className="mt-2 text-sm text-foreground/70">
            Create, edit, and delete products with explicit yes/no confirmations.
          </p>
        </Link>

        <Link
          href="/admin/categories"
          className="rounded-2xl border border-foreground/10 bg-background p-5 shadow-sm"
        >
          <h2 className="text-lg font-semibold">In-App Category CRUD</h2>
          <p className="mt-2 text-sm text-foreground/70">
            Create, edit, and delete categories with explicit yes/no confirmations.
          </p>
        </Link>

        <Link
          href="/admin/orders"
          className="rounded-2xl border border-foreground/10 bg-background p-5 shadow-sm"
        >
          <h2 className="text-lg font-semibold">In-App Order Management</h2>
          <p className="mt-2 text-sm text-foreground/70">
            Review orders and run controlled status updates with confirmation prompts.
          </p>
        </Link>

        <a
          href={adminUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-2xl border border-foreground/10 bg-background p-5 shadow-sm"
        >
          <h2 className="text-lg font-semibold">Open My Best Store</h2>
          <p className="mt-2 text-sm text-foreground/70">
            Manage product and category CRUD, inventory, pricing, and order lifecycle.
          </p>
        </a>

        <Link
          href="/admin/content"
          className="rounded-2xl border border-foreground/10 bg-background p-5 shadow-sm"
        >
          <h2 className="text-lg font-semibold">Homepage Content CMS</h2>
          <p className="mt-2 text-sm text-foreground/70">
            Edit hero slides, New Arrivals title, category title, and homepage stat blocks.
          </p>
        </Link>

        <div className="rounded-2xl border border-foreground/10 bg-background p-5 shadow-sm md:col-span-2">
          <h2 className="text-lg font-semibold">Audit Logging</h2>
          <p className="mt-2 text-sm text-foreground/70">
            Every admin mutation performed through this frontend API is written to
            logs/admin-audit.log as JSON lines for traceability.
          </p>
        </div>
      </div>
    </div>
  );
}
