REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (full_name) ON public.profiles TO authenticated;

DROP POLICY "Own year reads community" ON public.community_links;
CREATE POLICY "Own year reads community" ON public.community_links FOR SELECT TO authenticated
  USING (public.can_see_year(academic_year));