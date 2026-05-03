import prisma from '../src/config/prisma.js';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('--- Starting Indian Context Seeding ---');

  // 1. Clean up existing data (Ordered to respect constraints)
  console.log('Cleaning up existing transactional data...');
  await prisma.payment.deleteMany();
  await prisma.questionResponse.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.scheduleSlot.deleteMany();
  await prisma.availabilityPlan.deleteMany();
  await prisma.providerServiceMapping.deleteMany();
  await prisma.bookingQuestion.deleteMany();
  await prisma.service.deleteMany();
  await prisma.providerProfile.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.otpVerification.deleteMany();
  await prisma.rescheduleHistory.deleteMany();
  await prisma.authIdentity.deleteMany();
  await prisma.role.deleteMany();
  await prisma.serviceCategory.deleteMany();

  console.log('Cleanup complete.');

  // 2. Roles
  const roles = [
    { roleName: 'ADMIN', description: 'System Administrator' },
    { roleName: 'PROVIDER', description: 'Service Provider / Organiser' },
    { roleName: 'CUSTOMER', description: 'Regular User / Patient' },
  ];

  const roleMap = {};
  for (const r of roles) {
    const role = await prisma.role.create({ data: r });
    roleMap[r.roleName] = role.id;
  }
  console.log('Roles created.');

  // 3. Categories
  const categories = [
    { name: 'Healthcare & Wellness', slug: 'healthcare', description: 'Doctors, Ayurveda, Yoga, and Clinics' },
    { name: 'Professional Services', slug: 'professional', description: 'CA, Legal, and Business Consulting' },
    { name: 'Beauty & Grooming', slug: 'beauty', description: 'Salons, Spas, and Personal Care' },
    { name: 'Education & Coaching', slug: 'education', description: 'Tutors, Music Teachers, and Coaches' },
  ];

  const categoryMap = {};
  for (const cat of categories) {
    const category = await prisma.serviceCategory.create({ data: cat });
    categoryMap[cat.slug] = category.id;
  }
  console.log('Categories created.');

  const hashedPassword = await bcrypt.hash('Password@123', 10);

  // 4. Admin User
  await prisma.authIdentity.create({
    data: {
      email: 'admin@appointly.in',
      passwordHash: hashedPassword,
      roleId: roleMap['ADMIN'],
      isVerified: true,
      userProfile: {
        create: { fullName: 'Amit Sharma', phone: '9876543210', gender: 'MALE' },
      },
    },
  });
  console.log('Admin user created: admin@appointly.in');

  // 5. Providers & Services
  const providersData = [
    {
      email: 'dr.mehta@ayurveda.in',
      fullName: 'Dr. Aarav Mehta',
      phone: '9812345678',
      bio: 'Leading Ayurveda specialist in Mumbai with 15+ years of experience in traditional pulse diagnosis.',
      category: 'healthcare',
      serviceName: 'Ayurveda Consultation',
      description: 'Traditional pulse diagnosis (Nadi Pariksha) and personalized wellness plan.',
      price: 1200,
      duration: 45,
      location: "Doctor's Office, Mumbai",
      introMessage: 'Schedule your visit today and experience expert Ayurveda care.',
      confirmMessage: 'Thank you for your trust, Dr. Mehta will see you soon.',
      manageCapacity: false,
      manualConfirmation: true
    },
    {
      email: 'advocate.iyer@legal.in',
      fullName: 'Adv. Ishani Iyer',
      phone: '9823456789',
      bio: 'Expert in Family Law and Corporate Legalities, practicing in Bengaluru High Court.',
      category: 'professional',
      serviceName: 'Legal Consultation',
      description: 'One-on-one legal advisory for civil and corporate matters.',
      price: 2500,
      duration: 60,
      location: 'Online / Zoom',
      introMessage: 'Book your legal consultation. Please keep your documents ready.',
      confirmMessage: 'Your consultation is confirmed. A meeting link will be sent shortly.',
      manageCapacity: true,
      capacityLimit: 2,
      manualConfirmation: false
    },
    {
      email: 'ca.khanna@tax.in',
      fullName: 'CA Rajesh Khanna',
      phone: '9834567890',
      bio: 'Chartered Accountant specializing in GST, Income Tax Filing and Audit services in Delhi.',
      category: 'professional',
      serviceName: 'GST & Tax Filing',
      description: 'Comprehensive tax planning and GST return filing session.',
      price: 3500,
      duration: 60,
      location: 'Khanna Associates, New Delhi',
      introMessage: 'Streamline your taxes with expert CA advice.',
      confirmMessage: 'Booking confirmed. Please bring your previous tax returns.',
      manageCapacity: false,
      manualConfirmation: false
    },
    {
      email: 'sneha.style@glam.in',
      fullName: 'Sneha Kapoor',
      phone: '9845678901',
      bio: 'Award-winning hair stylist and skin care expert in Hyderabad.',
      category: 'beauty',
      serviceName: 'Bridal Makeover & Styling',
      description: 'Full bridal grooming and hair styling session.',
      price: 8000,
      duration: 180,
      location: 'Glam Studio, Jubilee Hills, Hyderabad',
      introMessage: 'Book your special day makeover.',
      confirmMessage: 'Your bridal session is booked! We will contact you for preferences.',
      manageCapacity: true,
      capacityLimit: 3,
      manualConfirmation: true
    },
    {
      email: 'amit.maths@edu.in',
      fullName: 'Prof. Amit Shah',
      phone: '9856789012',
      bio: 'Mathematics Coaching for IIT-JEE and Olympiad aspirants, Pune.',
      category: 'education',
      serviceName: 'JEE Advanced Math Session',
      description: 'Intensive problem-solving session for JEE Advanced preparation.',
      price: 1500,
      duration: 90,
      location: 'Shah Tutorials, Pune',
      introMessage: 'Join the masterclass to crack JEE Advanced.',
      confirmMessage: 'Seat reserved for the masterclass. Be on time.',
      manageCapacity: true,
      capacityLimit: 10,
      manualConfirmation: false
    },
  ];

  for (const p of providersData) {
    const auth = await prisma.authIdentity.create({
      data: {
        email: p.email,
        passwordHash: hashedPassword,
        roleId: roleMap['PROVIDER'],
        isVerified: true,
        userProfile: {
          create: { fullName: p.fullName, phone: p.phone, gender: p.fullName.startsWith('Dr.') || p.fullName.startsWith('Prof.') || p.fullName.startsWith('Adv.') ? 'MALE' : 'FEMALE' },
        },
        providerProfile: {
          create: { bio: p.bio, rating: 4.9 },
        },
      },
      include: { providerProfile: true },
    });

    const service = await prisma.service.create({
      data: {
        categoryId: categoryMap[p.category],
        name: p.serviceName,
        description: p.description,
        duration: p.duration,
        price: p.price,
        isPublished: true,
        location: p.location,
        introMessage: p.introMessage,
        confirmMessage: p.confirmMessage,
        manageCapacity: p.manageCapacity,
        capacityLimit: p.capacityLimit || 1,
        manualConfirmation: p.manualConfirmation
      },
    });

    await prisma.providerServiceMapping.create({
      data: {
        providerId: auth.providerProfile.id,
        serviceId: service.id,
      },
    });

    // Add Weekly Availability Plan
    const plan = await prisma.availabilityPlan.create({
      data: {
        providerId: auth.providerProfile.id,
        type: 'WEEKLY',
      },
    });

    // Add Slots (All 7 days, 10 AM to 5 PM)
    for (let day = 0; day <= 6; day++) {
      const slots = [];
      for (let hour = 10; hour < 17; hour++) {
        if (hour === 13) continue; // Lunch break
        slots.push({
          planId: plan.id,
          dayOfWeek: day,
          startTime: `${hour}:00`,
          endTime: `${hour + 1}:00`,
          capacity: 1
        });
      }
      await prisma.scheduleSlot.createMany({ data: slots });
    }
    console.log(`Provider & Service created: ${p.fullName} - ${p.serviceName}`);
  }

  // 6. Customers
  const customersData = [
    { email: 'rahul.desh@gmail.com', fullName: 'Rahul Deshmukh', phone: '9123456780', gender: 'MALE' },
    { email: 'priya.sharma@yahoo.com', fullName: 'Priya Sharma', phone: '9134567891', gender: 'FEMALE' },
    { email: 'vikram.verma@outlook.com', fullName: 'Vikram Verma', phone: '9145678902', gender: 'MALE' },
    { email: 'ananya.rao@gmail.com', fullName: 'Ananya Rao', phone: '9156789013', gender: 'FEMALE' },
  ];

  const customerAuthIds = [];
  for (const c of customersData) {
    const customer = await prisma.authIdentity.create({
      data: {
        email: c.email,
        passwordHash: hashedPassword,
        roleId: roleMap['CUSTOMER'],
        isVerified: true,
        userProfile: {
          create: { fullName: c.fullName, phone: c.phone, gender: c.gender },
        },
      },
    });
    customerAuthIds.push(customer.id);
    console.log(`Customer created: ${c.fullName}`);
  }

  // 7. Booking Questions (Sample)
  const ayurvedaService = await prisma.service.findFirst({ where: { name: 'Ayurveda Consultation' } });
  if (ayurvedaService) {
    await prisma.bookingQuestion.createMany({
      data: [
        { serviceId: ayurvedaService.id, label: 'Describe your primary health concern', type: 'TEXT', isRequired: true },
        { serviceId: ayurvedaService.id, label: 'Do you have any known allergies?', type: 'TEXT', isRequired: false },
      ]
    });
    console.log('Booking questions added for Ayurveda.');
  }

  console.log('--- Indian Context Seeding Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
