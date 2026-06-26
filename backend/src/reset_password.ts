import { prisma } from './db';
import bcrypt from 'bcryptjs';

async function main() {
  const username = 'admin';
  const plainPassword = 'admin';
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  const existing = await prisma.user.findUnique({
    where: { username }
  });

  if (existing) {
    await prisma.user.update({
      where: { username },
      data: { password: hashedPassword }
    });
    console.log(`Successfully updated existing admin password to '${plainPassword}'.`);
  } else {
    await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: 'ADMIN'
      }
    });
    console.log(`Created new admin user with password '${plainPassword}'.`);
  }

  // Double check all users
  const allUsers = await prisma.user.findMany();
  console.log('Current users in DB:', allUsers.map(u => ({ id: u.id, username: u.username, role: u.role })));
}

main()
  .catch(err => {
    console.error(err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
