-- ══════════════════════════════════════════════════════════════════
--  Vibz — Table de transparence financière
--  Colle ce SQL dans Supabase > SQL Editor et exécute-le
-- ══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.project_finances (
  id               integer       PRIMARY KEY DEFAULT 1,
  balance          numeric(10,2) NOT NULL DEFAULT 0,
  monthly_cost     numeric(10,2) NOT NULL DEFAULT 30,
  goal             numeric(10,2) NOT NULL DEFAULT 100,
  message          text,
  donations_paused boolean       NOT NULL DEFAULT false,
  updated_at       timestamptz   NOT NULL DEFAULT now()
);

-- ── Contrainte : une seule ligne (id = 1 toujours) ──────────────────
ALTER TABLE public.project_finances
  ADD CONSTRAINT single_row CHECK (id = 1);

-- ── Ligne initiale ──────────────────────────────────────────────────
INSERT INTO public.project_finances (id, balance, monthly_cost, goal, message)
VALUES (
  1,
  0.00,            -- solde de départ
  30.00,           -- coûts serveur Supabase + Vercel (~30€/mois)
  100.00,          -- objectif cagnotte (3 mois de coûts)
  'Vibz est un projet indépendant. Merci pour votre soutien 🙏'
)
ON CONFLICT (id) DO NOTHING;

-- ── RLS : lecture publique, écriture impossible depuis le client ─────
ALTER TABLE public.project_finances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_finances_public_read" ON public.project_finances;
CREATE POLICY "project_finances_public_read"
  ON public.project_finances FOR SELECT
  USING (true);

-- ── Realtime : active les mises à jour en temps réel ────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_finances;

-- ══════════════════════════════════════════════════════════════════
--  Pour mettre à jour le solde (depuis Supabase Dashboard > Table Editor
--  ou via SQL Editor — tu restes anonyme, personne ne voit qui écrit) :
--
--  UPDATE project_finances
--  SET balance    = 42.50,           -- nouveau solde
--      monthly_cost = 30.00,
--      message    = 'Un grand merci à nos donateurs 💙',
--      updated_at = now()
--  WHERE id = 1;
--
--  Pour suspendre les dons quand la cagnotte est pleine :
--  UPDATE project_finances SET donations_paused = true, updated_at = now() WHERE id = 1;
-- ══════════════════════════════════════════════════════════════════
