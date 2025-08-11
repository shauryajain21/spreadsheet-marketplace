import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create categories
  const categories = [
    {
      name: 'Financial Models',
      slug: 'financial-models',
      description: 'Budgets, forecasts, investment calculators'
    },
    {
      name: 'KPI Dashboards',
      slug: 'kpi-dashboards',
      description: 'Performance tracking and business metrics'
    },
    {
      name: 'Market Research',
      slug: 'market-research',
      description: 'Industry analysis and competitive intelligence'
    },
    {
      name: 'Project Management',
      slug: 'project-management',
      description: 'Task tracking and resource planning'
    },
    {
      name: 'Sales & CRM',
      slug: 'sales-crm',
      description: 'Lead tracking and sales pipeline management'
    },
    {
      name: 'HR & Operations',
      slug: 'hr-operations',
      description: 'Employee management and operational templates'
    },
    {
      name: 'Data Analysis',
      slug: 'data-analysis',
      description: 'Statistical models and data visualization'
    },
    {
      name: 'Inventory Management',
      slug: 'inventory-management',
      description: 'Stock tracking and supply chain'
    }
  ]

  console.log('Seeding categories...')
  
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    })
  }

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })