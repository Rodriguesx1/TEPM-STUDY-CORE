insert into public.plans (name, description, price_cents, features)
values
  ('Trial Terapêutico', 'Acesso inicial controlado para validação.', 0, '["biblioteca", "chat_ia_limitado"]'),
  ('Core Premium', 'Biblioteca, mentora IA, trilhas, caderno e comunidade.', 9900, '["pdf", "rag", "trilhas", "comunidade"]')
on conflict do nothing;
