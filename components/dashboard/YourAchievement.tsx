"use client";
import Image from "next/image";

import { useAppSelector } from "@/lib/redux/hooks";
import { metricSelectors } from "@/lib/redux/slices/metric";
import trophySrc from "@/public/dashboard/trophy.png";
import { getVerifiedRate } from "@/utils/metrics";

export function YourAchievement() {
  const {
    total_incoming_verified,
    total_incoming_all,
    total_outgoing_verified,
    total_outgoing_all,
  } = useAppSelector(metricSelectors.selectData);

  const incomingReviewVerifiedRate = getVerifiedRate(
    total_incoming_verified,
    total_incoming_all
  );
  const outgoingReviewAcceptanceRate = getVerifiedRate(
    total_outgoing_verified,
    total_outgoing_all
  );

  return (
    <>
      <p className="sr-only">
        There are {total_incoming_all} incoming review
        {total_incoming_all > 1 ? "s" : ""} in total (including all submitted,
        verified, and rejected reviews)
        {total_incoming_all > 0
          ? `, of which ${incomingReviewVerifiedRate}% are verified reviews.`
          : ""}
      </p>
      <p className="sr-only">
        There are {total_outgoing_all} incoming review
        {total_outgoing_all > 1 ? "s" : ""} in total (including all submitted,
        verified, and rejected reviews)
        {total_outgoing_all > 0
          ? `, of which ${outgoingReviewAcceptanceRate}% are verified reviews.`
          : ""}
      </p>
      <div aria-hidden className="grid grid-cols-[1fr_max-content]">
        <div className="grid grid-cols-2 grid-rows-[repeat(4,max-content)] gap-1 gap-x-4">
          <p className="text-5xl text-teal-700 font-bold pt-4">
            {total_incoming_all}
          </p>
          <p className="text-5xl text-purple-500 font-bold pt-4">
            {total_outgoing_all}
          </p>
          <p className="text-xl font-bold ">reviews you have received</p>
          <p className="text-xl font-bold ">reviews you have given</p>
          <p className="text-sm font-medium">
            (total number including all submitted, verified and rejected
            reviews)
          </p>
          <p className="text-sm font-medium">
            (total number including all submitted, verified and rejected
            reviews)
          </p>
          <p className="text-2xl text-teal-700 font-bold pt-3">
            {incomingReviewVerifiedRate}%
          </p>
          <p className="text-2xl text-purple-500 font-bold pt-3">
            {outgoingReviewAcceptanceRate}%
          </p>
          <p className="text-base font-bold">reviews are verified</p>
          <p className="text-base font-bold">acceptance rate</p>
        </div>
        <Image
          src={trophySrc}
          alt=""
          width={320}
          height={320}
          className="w-60 h-60 place-self-end"
        />
      </div>
    </>
  );
}
