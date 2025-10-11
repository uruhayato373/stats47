-- 開発用サンプルユーザー
INSERT INTO users (id, name, email, username, password_hash, role, is_active)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Administrator', 'admin@stats47.local', 'admin', '$2b$10$pp6HL4f9XElzUtMSGU4SD.88T/CUuxHxu83f3k871IZ7zmALZ0YiK', 'admin', 1),
  ('00000000-0000-0000-0000-000000000002', 'Test User', 'user@stats47.local', 'testuser', '$2b$10$cPKcatYmvHaggCtqtwAvru.q1Dpbqy.uX6AYBk/S/xw0YqYM3Znj6', 'user', 1);
