import prisma from '../src/config/prisma.js';

async function main() {
  console.log('--- Database Verification Report ---');
  
  const tables = await prisma.$queryRaw`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name NOT LIKE '_prisma_migrations'
  `;
  
  console.log(`Total Tables Found: ${tables.length}`);
  tables.forEach(t => console.log(`- ${t.table_name}`));

  const fks = await prisma.$queryRaw`
    SELECT count(*) as count
    FROM information_schema.table_constraints 
    WHERE constraint_type = 'FOREIGN KEY'
    AND table_schema = 'public'
  `;
  console.log(`Total Foreign Keys: ${fks[0].count}`);

  const pks = await prisma.$queryRaw`
    SELECT count(*) as count
    FROM information_schema.table_constraints 
    WHERE constraint_type = 'PRIMARY KEY'
    AND table_schema = 'public'
  `;
  console.log(`Total Primary Keys: ${pks[0].count}`);

  console.log('--- End of Report ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
