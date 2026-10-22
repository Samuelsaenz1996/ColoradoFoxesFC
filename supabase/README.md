# Registrations backend (Supabase) + Admin

The website forms save registrations to **Supabase**. You manage them at **`/admin`**
(e.g. `https://www.coloradofoxesfc.com/admin/`).

| File | What it is |
|---|---|
| `supabase/schema.sql` | The database: tables, security rules, and the submit function |
| `supabase-config.js` | Your Supabase URL + public key (used by the site **and** the admin) |
| `admin/` | The admin app (login, dashboard, lists, Gear & Print, data sources) |

---

## One-time setup (about 10 minutes)

1. **Create the project.** Go to [supabase.com](https://supabase.com), sign in, and click **New project**. Name it
   e.g. `colorado-foxes`, pick a strong database password, and choose the region closest to Colorado (US West).

2. **Create the database.** Open **SQL Editor → New query**, paste everything from `supabase/schema.sql`,
   and click **Run**. You should see "Success".

3. **Connect the website.** Open **Project Settings → API** (or **Data API**) and copy:
   - **Project URL** → `url` in `supabase-config.js`
   - **anon / public key** → `anonKey` in `supabase-config.js`

   The anon key is safe to be public: it can only *add* registrations. **Never** paste the `service_role` key.

4. **Create your admin login.** Open **Authentication → Users → Add user → Create new user**. Enter your
   email and a password, and tick "Auto confirm user".

5. **Make that user an admin.** Back in **SQL Editor**, run this with your email:
   ```sql
   insert into public.admins (user_id, email)
   select id, email from auth.users where email = 'you@example.com'
   on conflict (user_id) do nothing;
   ```
   Repeat steps 4–5 for anyone else who should have access.

6. **Lock down sign-ups.** In **Authentication → Sign In / Providers**, turn **off** "Allow new users to sign up".
   Even if someone did sign up, they would see "No access", because only users in `admins` can see data.

7. **Make password reset emails work.** In **Authentication → URL Configuration**, set the **Site URL** to your
   site (`https://www.coloradofoxesfc.com`) and add `https://www.coloradofoxesfc.com/admin/` to **Redirect URLs**.

8. *(Optional)* **Turn on live updates.** In **Database → Publications → supabase_realtime**, enable the
   `registrations` table. New sign-ups will then pop up in the admin without needing to refresh.

9. **Publish** the site, open `/admin`, and sign in. Submit a test registration on the website. It should
   appear on the dashboard.

---

## Day-to-day

- **Dashboard:** totals, unpaid count, players by age group and team, sizes needed, and recent sign-ups.
  Click any bar or tile to jump to that filtered list.
- **Youth Programs / Pro Team Tryouts:**
  - Group by age group, team, program, location, size, birth year and more.
  - Filter, search, select rows, mark paid, export to CSV, or print a roster with a check-in column.
- **Click a player** to see and edit everything: payment, gear status, jersey number and name,
  private notes, and the waiver timestamp. You can also print their info card.
- **Gear & Print:** a size-totals table (sizes × teams) plus a production list where you type jersey
  numbers and names straight into the table. **Print order sheet** gives the shop a checklist.
  **Export for shop** gives a spreadsheet.
- **Payments** happen on Royalty Sports. Mark players **Paid** in the admin once you see their order.

## Adding more ways to bring in data

- **New kind of sign-up** (camp, clinic…): Admin → **Data Sources → Registration types → Add type**.
  It gets its own page automatically.
- **Another website/app:** call the `submit_registration` function with the public key. A copy-paste
  example is on the **Data Sources** page. Give it its own `p_source` name so you can tell sources apart.
- **Spreadsheets:** Admin → **Data Sources → Import CSV**.
- Any extra fields a form sends are kept and shown under the player's details, so nothing is lost.
