-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text NOT NULL UNIQUE,
  academic_year smallint NOT NULL CHECK (academic_year BETWEEN 1 AND 4),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (full_name, academic_year) ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.current_user_year()
RETURNS smallint LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT academic_year FROM public.profiles WHERE id = auth.uid()
$$;

CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Signup: create profile; first account becomes admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _year smallint;
BEGIN
  PERFORM pg_advisory_xact_lock(73019);
  _year := COALESCE(NULLIF(NEW.raw_user_meta_data->>'academic_year', '')::smallint, 1);
  INSERT INTO public.profiles (id, full_name, phone, academic_year)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), 'طالب'),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'phone', ''), split_part(NEW.email, '@', 1)),
    _year
  );
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Subjects
CREATE TABLE public.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  academic_year smallint NOT NULL CHECK (academic_year BETWEEN 1 AND 4),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subjects TO authenticated;
GRANT ALL ON public.subjects TO service_role;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed in read subjects" ON public.subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins insert subjects" ON public.subjects FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update subjects" ON public.subjects FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete subjects" ON public.subjects FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Summaries
CREATE TABLE public.summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text,
  link_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.summaries TO authenticated;
GRANT ALL ON public.summaries TO service_role;
ALTER TABLE public.summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed in read summaries" ON public.summaries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins insert summaries" ON public.summaries FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update summaries" ON public.summaries FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete summaries" ON public.summaries FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Quizzes
CREATE TABLE public.quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quizzes TO authenticated;
GRANT ALL ON public.quizzes TO service_role;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed in read quizzes" ON public.quizzes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins insert quizzes" ON public.quizzes FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update quizzes" ON public.quizzes FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete quizzes" ON public.quizzes FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_questions TO authenticated;
GRANT ALL ON public.quiz_questions TO service_role;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed in read questions" ON public.quiz_questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins insert questions" ON public.quiz_questions FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update questions" ON public.quiz_questions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete questions" ON public.quiz_questions FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Answer keys hidden from students
CREATE TABLE public.quiz_answer_keys (
  question_id uuid PRIMARY KEY REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  correct_index integer NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_answer_keys TO authenticated;
GRANT ALL ON public.quiz_answer_keys TO service_role;
ALTER TABLE public.quiz_answer_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage answer keys" ON public.quiz_answer_keys FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  score integer NOT NULL,
  total integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX quiz_attempts_user_idx ON public.quiz_attempts(user_id);
GRANT SELECT ON public.quiz_attempts TO authenticated;
GRANT ALL ON public.quiz_attempts TO service_role;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own attempts" ON public.quiz_attempts FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Grade a quiz on the server
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
GRANT EXECUTE ON FUNCTION public.submit_quiz(uuid, jsonb) TO authenticated;

-- Leaderboard: sum of best score per quiz, per academic year
CREATE OR REPLACE FUNCTION public.get_leaderboard(_year smallint)
RETURNS TABLE (user_id uuid, full_name text, points bigint, quizzes_taken bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH best AS (
    SELECT a.user_id, a.quiz_id, MAX(a.score) AS best_score
    FROM public.quiz_attempts a
    GROUP BY a.user_id, a.quiz_id
  )
  SELECT p.id, p.full_name, COALESCE(SUM(b.best_score), 0)::bigint AS points, COUNT(b.quiz_id)::bigint AS quizzes_taken
  FROM public.profiles p
  LEFT JOIN best b ON b.user_id = p.id
  WHERE p.academic_year = _year AND auth.uid() IS NOT NULL
  GROUP BY p.id, p.full_name
  ORDER BY points DESC, p.full_name ASC
  LIMIT 50
$$;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(smallint) TO authenticated;

-- Learning links
CREATE TABLE public.learning_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  url text NOT NULL,
  category text NOT NULL DEFAULT 'youtube' CHECK (category IN ('youtube', 'platform', 'other')),
  topic text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.learning_links TO authenticated;
GRANT ALL ON public.learning_links TO service_role;
ALTER TABLE public.learning_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed in read learning" ON public.learning_links FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins insert learning" ON public.learning_links FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update learning" ON public.learning_links FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete learning" ON public.learning_links FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Community group links
CREATE TABLE public.community_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  url text NOT NULL,
  platform text NOT NULL DEFAULT 'whatsapp' CHECK (platform IN ('whatsapp', 'telegram', 'facebook', 'discord', 'other')),
  academic_year smallint CHECK (academic_year BETWEEN 1 AND 4),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_links TO authenticated;
GRANT ALL ON public.community_links TO service_role;
ALTER TABLE public.community_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed in read community" ON public.community_links FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins insert community" ON public.community_links FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update community" ON public.community_links FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete community" ON public.community_links FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Cohort chat
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  sender_name text NOT NULL DEFAULT '',
  academic_year smallint NOT NULL DEFAULT 1,
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX chat_messages_year_idx ON public.chat_messages(academic_year, created_at DESC);
GRANT SELECT, INSERT, DELETE ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.fill_chat_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _p record;
BEGIN
  SELECT full_name, academic_year INTO _p FROM public.profiles WHERE id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'profile not found'; END IF;
  NEW.user_id := auth.uid();
  NEW.sender_name := _p.full_name;
  NEW.academic_year := _p.academic_year;
  NEW.created_at := now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER chat_messages_fill BEFORE INSERT ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.fill_chat_message();

CREATE POLICY "Cohort reads chat" ON public.chat_messages FOR SELECT TO authenticated
  USING (academic_year = public.current_user_year());
CREATE POLICY "Users send chat" ON public.chat_messages FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Owner or admin delete chat" ON public.chat_messages FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;