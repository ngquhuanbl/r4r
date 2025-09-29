import { BusinessList } from "@/components/my-business/BusinessList";

export default function Page() {
  return (
    <>
      <section>
        <div className="mb-5">
          <h1
            id="section-1-title"
            aria-describedby="section-1-desc"
            className="font-bold sm:text-lg"
          >
            MY BUSINESSES
          </h1>
          <p id="section-1-desc" className="font-light text-sm sm:text-base">
            View and manage all my business profiles
          </p>
        </div>
        <BusinessList />
      </section>
    </>
  );
}
