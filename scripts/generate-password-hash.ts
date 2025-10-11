import bcrypt from "bcryptjs";

async function generateHash(password: string) {
  const hash = await bcrypt.hash(password, 10);
  console.log(`Password: ${password}`);
  console.log(`Hash: ${hash}\n`);
}

async function main() {
  console.log("Generating password hashes...\n");
  await generateHash("admin123");
  await generateHash("user123");
}

main();
