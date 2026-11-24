<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

<!-- AGENT-MEMORY:BEGIN -->
- Keep storefront navigation and footer in StoreShell around the root Outlet so all public pages share a consistent layout.
- Catalog, orders and accounts live in Lovable Cloud; never seed pretend products, orders or payments.
- Roles live in user_roles checked via has_role; the manager role is granted only by a DB trigger on the confirmed owner email.
- Orders go through the place_order SQL function so prices are frozen and stock is decremented atomically; payment is cash on delivery until a real gateway exists.
- products-images is a private bucket (public buckets are blocked); store paths and display via signed URLs.
- /admin uses ssr:false with a beforeLoad role check through canEnterAdmin (src/lib/admin-access.ts); the dashboard re-checks it, and RLS enforces every write.
- has_role must stay non-executable by anon: keep anon and authenticated select policies separate so anonymous reads never call it.
- Storefront categories come live from the categories table (publicCategoriesQuery); image_url holds a storage path, with bundled editorial images as fallback for the original slugs.
- Animations: Motion uses transform/opacity for short one-time scroll reveals; GSAP is dynamically loaded for the hero intro only, without ScrollTrigger or continuous parallax, to keep shopping interactions immediate; all respect reduced motion.
- Recover missing route bundles in the root error boundary with one session-scoped reload per minute; preserve manual retry to avoid offline reload loops.
- Keep the editorial storefront direction in the shared stylesheet and Button variants, with the responsive masthead in StoreShell and live category mosaics in CategoryGrid; preserve catalog queries and admin authorization so visual work cannot change commerce permissions.
- Implement pill-button geometry and interaction states in the shared Button variants and stylesheet; preserve Radix Slot composition and reduced-motion support so every action stays accessible.
- StoreShell menu and cart use a shared right-side Dialog drawer with Radix focus management; close on navigation rather than arbitrary content clicks to preserve typing and keyboard access.
<!-- AGENT-MEMORY:END -->
