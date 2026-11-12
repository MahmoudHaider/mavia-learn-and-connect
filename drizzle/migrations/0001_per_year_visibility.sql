CREATE OR REPLACE FUNCTION public.can_see_year(_year smallint)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'admin') OR _year = public.current_user_year()
$$;

CREATE OR REPLACE FUNCTION public.can_see_subject(_subject_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.subjects s WHERE s.id = _subject_id AND public.can_see_year(s.academic_year))
$$;

CREATE OR REPLACE FUNCTION public.can_see_quiz(_quiz_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id = _quiz_id AND public.can_see_subject(q.subject_id))
$$;

DROP POLICY "Signed in read subjects" ON public.subjects;
CREATE POLICY "Own year reads subjects" ON public.subjects FOR SELECT TO authenticated
  USING (public.can_see_year(academic_year));

DROP POLICY "Signed in read summaries" ON public.summaries;
CREATE POLICY "Own year reads summaries" ON public.summaries FOR SELECT TO authenticated
  USING (public.can_see_subject(subject_id));

DROP POLICY "Signed in read quizzes" ON public.quizzes;
CREATE POLICY "Own year reads quizzes" ON public.quizzes FOR SELECT TO authenticated
  USING (public.can_see_subject(subject_id));

DROP POLICY "Signed in read questions" ON public.quiz_questions;
CREATE POLICY "Own year reads questions" ON public.quiz_questions FOR SELECT TO authenticated
  USING (public.can_see_quiz(quiz_id));

DROP POLICY "Signed in read community" ON public.community_links;
CREATE POLICY "Own year reads community" ON public.community_links FOR SELECT TO authenticated
  USING (academic_year IS NULL OR public.can_see_year(academic_year));

CREATE OR REPLACE FUNCTION public.get_leaderboard(_year smallint)
RETURNS TABLE (user_id uuid, full_name text, points bigint, quizzes_taken bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH target AS (
    SELECT CASE WHEN public.has_role(auth.uid(), 'admin') THEN _year ELSE public.current_user_year() END AS y
  ), best AS (
    SELECT a.user_id, a.quiz_id, MAX(a.score) AS best_score
    FROM public.quiz_attempts a
    GROUP BY a.user_id, a.quiz_id
  )
  SELECT p.id, p.full_name, COALESCE(SUM(b.best_score), 0)::bigint AS points, COUNT(b.quiz_id)::bigint AS quizzes_taken
  FROM public.profiles p
  CROSS JOIN target t
  LEFT JOIN best b ON b.user_id = p.id
  WHERE p.academic_year = t.y AND auth.uid() IS NOT NULL
  GROUP BY p.id, p.full_name
  ORDER BY points DESC, p.full_name ASC
  LIMIT 50
$$;

CREATE OR REPLACE FUNCTION public.submit_quiz(_quiz_id uuid, _answers jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _score integer := 0;
  _total integer := 0;
  _results jsonb := '[]'::jsonb;
  _q record;
  _chosen integer;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF NOT public.can_see_quiz(_quiz_id) THEN RAISE EXCEPTION 'quiz not available'; END IF;
  FOR _q IN
    SELECT qq.id, k.correct_index
    FROM public.quiz_questions qq
    LEFT JOIN public.quiz_answer_keys k ON k.question_id = qq.id
    WHERE qq.quiz_id = _quiz_id
    ORDER BY qq.position, qq.created_at
  LOOP
    _total := _total + 1;
    _chosen := NULLIF(_answers->>(_q.id::text), '')::integer;
    IF _chosen IS NOT NULL AND _chosen = _q.correct_index THEN
      _score := _score + 1;
    END IF;
    _results := _results || jsonb_build_object('question_id', _q.id, 'correct_index', _q.correct_index, 'chosen', _chosen);
  END LOOP;
  IF _total = 0 THEN RAISE EXCEPTION 'quiz has no questions'; END IF;
  INSERT INTO public.quiz_attempts (user_id, quiz_id, score, total) VALUES (_uid, _quiz_id, _score, _total);
  RETURN jsonb_build_object('score', _score, 'total', _total, 'results', _results);
END;
$$;