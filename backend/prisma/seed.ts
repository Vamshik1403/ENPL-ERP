import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const username = 'admin';
  const password = 'admin123';
  const hashedPassword = await bcrypt.hash(password, 10);

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    console.log('Admin user already exists, skipping...');
    return;
  }

  const user = await prisma.user.create({
    data: {
      username,
      password: hashedPassword,
      fullName: 'Super Admin',
      email: 'admin@enpl.com',
      userType: 'SUPERADMIN',
      department: 'Administration',
    },
  });

  console.log('Superadmin user created successfully!');
  console.log(`Username: ${username}`);
  console.log(`Password: ${password}`);
  console.log('User ID:', user.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
