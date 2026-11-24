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
- The private administration uses a client-only route gate plus an authenticated server snapshot per screen; server mutations revalidate the user, has_role, pinned TOTP and session age, with RLS as the final boundary, because neither a hidden path nor a client gate authorizes an RPC.
- Activate sticky admin MFA only after native TOTP verification through activate_admin_mfa; has_role requires aal2 and the session's pinned verified factor for activated managers, and browser clients cannot reset or rebind activation, preventing factor removal or new enrollment from restoring password-only access.
- Use own user_roles reads for pre-MFA manager identity and has_role for privileged authorization; this lets managers reach the verification form without granting pre-MFA management rights after activation.
- Keep the private /compte login outside the storefront shell with no public navigation links and noindex metadata; a separate protected domain needs independent origin-bypass verification before it can be called isolated.
- has_role must stay non-executable by anon: keep anon and authenticated select policies separate so anonymous reads never call it.
- Storefront categories come live from the categories table (publicCategoriesQuery); image_url holds a storage path, with bundled editorial images as fallback for the original slugs.
- Animations: Motion uses transform/opacity for short one-time scroll reveals; GSAP is dynamically loaded for the hero intro only, without ScrollTrigger or continuous parallax, to keep shopping interactions immediate; all respect reduced motion.
- Recover missing route bundles in the root error boundary with one session-scoped reload per minute; preserve manual retry to avoid offline reload loops.
- Scope the reference storefront theme to StoreShell and its shared controls, with a responsive capsule masthead and live categories; keep the administration theme and commerce authorization independent of visual changes.
- Implement pill-button geometry and interaction states in the shared Button variants and stylesheet; preserve Radix Slot composition and reduced-motion support so every action stays accessible.
- StoreShell menu and cart use a shared right-side Dialog drawer with Radix focus management; close on navigation rather than arbitrary content clicks to preserve typing and keyboard access.
- Admin screens use server functions for all data mutations and file operations; table triggers journal changes atomically and file handlers journal storage actions, avoiding client-controlled prices, permissions and audit attribution.
- Guest orders are created only through the atomic place_order RPC, never unrestricted direct inserts, so public checkout cannot forge totals or bypass stock checks.
- Public image signing first selects eligible paths through anonymous RLS, then uses privileged storage signing only for those paths; requiring a manager for storefront images would break guest shopping.
- Password login uses a durable atomic server limiter, generic failures and real Turnstile verification when configured; never trust caller-controlled forwarding headers for IP limits, and never pretend the app limiter protects the directly reachable hosted Auth endpoint.
- The server entry applies security headers and supplies the router with a fresh request nonce for CSP rather than allowing arbitrary inline JavaScript; private administration pages deny framing while public pages remain previewable.
- Final HTML responses synchronize script nonces with CSP using parser source offsets and disable document caching; preserve hydration script bytes so preview/bootstrap scripts cannot be blocked by a stale or missing nonce.
<!-- AGENT-MEMORY:END -->
