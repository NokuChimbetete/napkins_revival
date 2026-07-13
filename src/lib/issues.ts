import { createClient } from "@/lib/supabase/server";
import type { Issue } from "@/lib/types";

// Design-sourced covers, used until the Supabase project is configured and seeded.
const FALLBACK_ISSUES: Issue[] = [
  { id: "fallback-1", issue_number: 1, title: "Summer 2022", cover_url: "/assets/cover-issue-1.png", pdf_url: "", published_at: "2022-06-01" },
  { id: "fallback-2", issue_number: 2, title: "Fall 2022", cover_url: "/assets/cover-issue-2.png", pdf_url: "", published_at: "2022-10-01" },
  { id: "fallback-3", issue_number: 3, title: "Summer 2023", cover_url: "/assets/cover-issue-3.png", pdf_url: "", published_at: "2023-06-01" },
  { id: "fallback-4", issue_number: 4, title: "Fall 2023", cover_url: "/assets/cover-issue-4.jpeg", pdf_url: "", published_at: "2023-10-01" },
  { id: "fallback-5", issue_number: 5, title: "Spring 2024", cover_url: "/assets/cover-issue-5.jpeg", pdf_url: "", published_at: "2024-03-01" },
  { id: "fallback-6", issue_number: 6, title: "Summer 2024", cover_url: "/assets/cover-issue-6.png", pdf_url: "", published_at: "2024-06-01" },
  { id: "fallback-7", issue_number: 7, title: "Winter 2024", cover_url: "/assets/cover-issue-7.jpg", pdf_url: "", published_at: "2024-12-01" },
  { id: "fallback-8", issue_number: 8, title: "Spring 2025", cover_url: "/assets/cover-issue-8.jpeg", pdf_url: "", published_at: "2025-03-01" },
];

function supabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key && !url.includes("your-project-ref") && !key.startsWith("your-"));
}

export async function getIssues(): Promise<Issue[]> {
  if (!supabaseConfigured()) return FALLBACK_ISSUES;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("issues")
      .select("*")
      .order("issue_number", { ascending: true });
    if (error || !data?.length) return FALLBACK_ISSUES;
    return data;
  } catch {
    return FALLBACK_ISSUES;
  }
}
