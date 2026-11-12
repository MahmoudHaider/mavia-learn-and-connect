import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Me {
  id: string;
  fullName: string;
  phone: string;
  academicYear: number;
  isAdmin: boolean;
}

export const meQueryOptions = queryOptions({
  queryKey: ["me"],
  queryFn: async (): Promise<Me | null> => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return null;
    const [{ data: profile }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", user.id),
    ]);
    return {
      id: user.id,
      fullName: profile?.full_name ?? "طالب",
      phone: profile?.phone ?? "",
      academicYear: profile?.academic_year ?? 1,
      isAdmin: (roles ?? []).some((r) => r.role === "admin"),
    };
  },
  staleTime: 60_000,
});

export function useMe() {
  return useQuery(meQueryOptions);
}
