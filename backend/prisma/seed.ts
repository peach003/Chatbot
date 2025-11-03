import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create a demo user
  const user = await prisma.user.upsert({
    where: { email: 'demo@smartnz.com' },
    update: {},
    create: {
      email: 'demo@smartnz.com',
      name: 'Demo User',
      locale: 'en',
    },
  })

  console.log('✅ Created demo user:', user.email)

  // Create a demo itinerary
  const itinerary = await prisma.itinerary.create({
    data: {
      userId: user.id,
      title: 'South Island Adventure - 7 Days',
      description: 'Explore the stunning South Island of New Zealand',
      locale: 'en',
      startDate: new Date('2025-12-01'),
      endDate: new Date('2025-12-07'),
      destination: 'South Island, New Zealand',
      travelers: 2,
      budget: 3000,
      currency: 'NZD',
      status: 'DRAFT',
      days: {
        create: [
          {
            dayNumber: 1,
            date: new Date('2025-12-01'),
            title: 'Arrival in Queenstown',
            description: 'Arrive and explore the adventure capital',
            activities: {
              create: [
                {
                  name: 'Queenstown Gardens',
                  type: 'ATTRACTION',
                  location: 'Queenstown',
                  description: 'Beautiful botanical gardens with lake views',
                  duration: 120,
                  cost: 0,
                  order: 1,
                },
              ],
            },
          },
        ],
      },
    },
  })

  console.log('✅ Created demo itinerary:', itinerary.title)

  // Create a demo favorite
  const favorite = await prisma.favorite.create({
    data: {
      userId: user.id,
      type: 'ATTRACTION',
      name: 'Milford Sound',
      description: 'Stunning fiord in Fiordland National Park',
      location: 'Fiordland, South Island',
      rating: 4.9,
    },
  })

  console.log('✅ Created demo favorite:', favorite.name)

  console.log('🎉 Seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
