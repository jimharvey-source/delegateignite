import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRICES = {
  monthly: "price_1TG0FXPCddeRRjxQv6chiby5",
  annual: "price_1TG0GrPCddeRRjxQX1rAHTiv",
  lifetime: "price_1TG0I0PCddeRRjxQAI4pOYAU",
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { plan, origin } = req.body;

  if (!plan || !PRICES[plan]) {
    return res.status(400).json({ error: "Invalid plan" });
  }

  try {
    const isSubscription = plan === "monthly" || plan === "annual";

    const sessionParams = {
      payment_method_types: ["card"],
      line_items: [{ price: PRICES[plan], quantity: 1 }],
      mode: isSubscription ? "subscription" : "payment",
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`,
      cancel_url: `${origin}/?cancelled=true`,
      billing_address_collection: "auto",
    };

    const session = await stripe.checkout.sessions.create(sessionParams);
    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Stripe error:", err.message);
    res.status(500).json({ error: err.message });
  }
}
