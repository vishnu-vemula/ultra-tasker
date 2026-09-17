process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5434/ultra_tasker?schema=public';
process.env.FIREBASE_SERVICE_ACCOUNT_KEY =
  '{"project_id":"e2e-test","client_email":"e2e@test.iam.gserviceaccount.com","private_key":"-----BEGIN PRIVATE KEY-----\\nMIIEvQ\\n-----END PRIVATE KEY-----\\n"}';
process.env.BOOTSTRAP_ADMIN_EMAILS = 'e2e@example.com';
process.env.RATE_LIMIT_MAX = '1000';
