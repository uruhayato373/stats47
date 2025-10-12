// scripts/hash-password.js
const bcrypt = require('bcryptjs');

// ハッシュ化するパスワード
const password = process.argv[2] || 'daisuke1275';

// saltRounds（セキュリティレベル）
const saltRounds = 10;

// パスワードをハッシュ化
bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error hashing password:', err);
    process.exit(1);
  }

  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('\nCopy this hash for the SQL INSERT command:');
  console.log(hash);
});
