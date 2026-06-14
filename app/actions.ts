"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient, hasSupabaseEnv } from "./lib/supabase/server";

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function signIn(formData: FormData) {
  if (!hasSupabaseEnv()) {
    redirect("/?error=Supabase%20env%20mangler");
  }
  const email = formString(formData, "email");
  const password = formString(formData, "password");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(`/?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/");
  redirect("/");
}

export async function signUp(formData: FormData) {
  if (!hasSupabaseEnv()) {
    redirect("/?error=Supabase%20env%20mangler");
  }
  const email = formString(formData, "email");
  const password = formString(formData, "password");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) {
    redirect(`/?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/");
  redirect("/");
}

export async function signOut() {
  if (hasSupabaseEnv()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  revalidatePath("/");
  redirect("/");
}

export async function createWorkspace(formData: FormData) {
  if (!hasSupabaseEnv()) {
    redirect("/?error=Supabase%20env%20mangler");
  }
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    redirect("/?error=Innlogging%20kreves");
  }

  const orgNumber = formString(formData, "orgNumber");
  const name = formString(formData, "name");
  const entityType = formString(formData, "entityType").toUpperCase();
  if (!/^\d{9}$/.test(orgNumber)) {
    redirect("/?error=Organisasjonsnummer%20m%C3%A5%20ha%209%20sifre");
  }

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .insert({
      org_number: orgNumber,
      name,
      entity_type: entityType,
      status_text: entityType === "AS" ? "aktiv" : "blokkeres",
      source: "manual",
      created_by: user.id,
      identity_confirmed_at: entityType === "AS" ? new Date().toISOString() : null,
      identity_locked_at: entityType === "AS" ? new Date().toISOString() : null,
    })
    .select("id")
    .single();

  if (companyError || !company) {
    redirect(`/?error=${encodeURIComponent(companyError?.message ?? "Kunne ikke opprette selskap")}`);
  }

  const { error: membershipError } = await supabase.from("company_memberships").insert({
    company_id: company.id,
    user_id: user.id,
    role: "owner",
    accepted_at: new Date().toISOString(),
  });
  if (membershipError) {
    redirect(`/?error=${encodeURIComponent(membershipError.message)}`);
  }

  await supabase.from("audit_events").insert({
    company_id: company.id,
    actor_id: user.id,
    category: "company",
    action: "workspace_created",
    message: "Selskapsarbeidsflate opprettet.",
  });

  revalidatePath("/");
  redirect("/");
}
