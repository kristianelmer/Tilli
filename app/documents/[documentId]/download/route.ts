import { redirect } from "next/navigation";
import { COMPANY_DOCUMENTS_BUCKET } from "../../../lib/documents";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

export async function GET(_request: Request, { params }: { params: Promise<Record<string, string>> }) {
  const documentId = (await params).documentId;
  const supabase = await createSupabaseServerClient();
  const { data: document, error } = await supabase
    .from("documents")
    .select("storage_key")
    .eq("id", documentId)
    .single();

  if (error || !document) {
    return new Response("Document not found", { status: 404 });
  }

  const { data, error: signedError } = await supabase.storage
    .from(COMPANY_DOCUMENTS_BUCKET)
    .createSignedUrl(document.storage_key, 300);

  if (signedError || !data?.signedUrl) {
    return new Response("Could not create signed URL", { status: 403 });
  }

  redirect(data.signedUrl);
}
