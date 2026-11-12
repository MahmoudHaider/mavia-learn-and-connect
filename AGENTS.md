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

## Project rules (MAVIA)
- UI text is bilingual through `useLang().tr(ar, en)` from `src/lib/i18n.tsx`; Arabic is the SSR default and the client flips `html[dir]`, so use logical Tailwind classes (`ms-`, `me-`, `start-`, `end-`, `text-start`) and `ltr:`/`rtl:` variants for icons. Why: one codebase serves RTL and LTR.
- Login uses phone + password mapped to a synthetic `<digits>@mavia.app` email (`src/lib/phone.ts`); auto-confirm is on. Why: auth needs an email and students have none on the platform.
- Year scoping lives in RLS (`can_see_year`/`can_see_subject`/`can_see_quiz`); admins see all years. Why: students must only see their own cohort even if they bypass the UI.
- Quiz answer keys are in an admin-only table and grading runs in the `submit_quiz` SQL function. Why: students must not read correct answers or forge scores.
- GPA math lives in `src/lib/gpa.ts` with tests in `src/test/gpa.test.ts`; keep marks split and grade scale there only. Why: single source for the calculator and its tests.
