"use server";

import { z } from "zod";
import { tourIds } from "@/components/tour/tours";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/server/auth";

const tourSchema = z.enum(tourIds);

/**
 * Records that a guided tour auto-started for the signed-in person, so it does not
 * start again on another device. Replaying from "Help" never calls this twice.
 */
export async function markTourCompleted(tour: unknown): Promise<void> {
  const parsed = tourSchema.parse(tour);
  const profile = await requireProfile();
  if (profile.toursCompleted.includes(parsed)) return;

  const supabase = await createClient();
  // RLS limits the update to the person's own row; the column grant limits it to this column.
  await supabase
    .from("profiles")
    .update({ tours_completed: [...profile.toursCompleted, parsed] })
    .eq("id", profile.id);
}
