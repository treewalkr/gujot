import { error } from "@sveltejs/kit";
import { eden } from "$lib/server/eden";
import { CURRENCIES, Money, type Currency } from "@gujot/shared";
import type { Actions, PageServerLoad } from "./$types";

// Loads backend data server-side via Eden during SSR. The route type flows
// from the backend's `type App` at compile time, so a signature change on the
// backend becomes a type error here.
export const load: PageServerLoad = async () => {
  const { data: status, error: statusErr } = await eden.status.get();
  const { data: entries, error: entriesErr } = await eden.entries.get();
  if (statusErr || !status) throw error(500, "backend /status unreachable");
  if (entriesErr || !entries) throw error(500, "backend /entries unreachable");
  return { status, entries };
};

// Form action: create a ledger entry. The user enters a major-unit amount
// (dollars); Money.fromDecimal converts it to minor units before posting, so
// the wire shape matches the backend's integer amount.
export const actions: Actions = {
  default: async ({ request }) => {
    const form = await request.formData();
    const amountRaw = String(form.get("amount") ?? "").trim();
    const currency = String(form.get("currency"));
    const label = String(form.get("label")).trim();
    const amount = Number(amountRaw);

    // Reject the empty string explicitly: Number("") === 0 is finite, so without
    // this a crafted POST with no amount would create a $0 entry. The HTML
    // `required` covers the browser path; this guards the server path.
    if (
      amountRaw === "" ||
      !Number.isFinite(amount) ||
      !(CURRENCIES as readonly string[]).includes(currency) ||
      !label
    ) {
      throw error(400, "invalid entry");
    }

    const money = Money.fromDecimal(amount, currency as Currency);
    const { error: backendError } = await eden.entries.post({
      amount: money.amount,
      currency: money.currency,
      label,
    });
    if (backendError) throw error(500, "backend POST /entries failed");
  },
};
