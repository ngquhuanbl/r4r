import { YourReview } from "@/components/dashboard/YourReview/Index";
import { getUserOrRedirect } from "@/lib/supabase/server";

export default async function Page() {
  const user = await getUserOrRedirect();
  return (
    <>
      <section>
        <div className="mb-5">
          <h1
            id="section-1-title"
            aria-describedby="section-1-desc"
            className="font-bold sm:text-lg"
          >
            YOUR REVIEWS
          </h1>
          <p id="section-1-desc" className="font-light text-sm sm:text-base">
            Your central hub for all incoming/outgoing reviews.
          </p>
        </div>
        <YourReview userId={user.id} />
      </section>
      <section className="mt-10 hidden md:block">
        <h1
          id="section-2-title"
          aria-describedby="section-2-desc"
          className="font-bold sm:text-lg"
        >
          YOUR ACHIEVEMENT
        </h1>
        <p id="section-2-desc" className="font-light text-sm sm:text-base">
          Everything you have achieved so far with the community
        </p>
      </section>
    </>
  );
}
