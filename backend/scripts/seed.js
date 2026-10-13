/* eslint-disable no-console */
const dns = require('dns')
dns.setServers(['8.8.8.8', '8.8.4.4'])
const path = require('path')
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') })
const connectDB = require('../src/config/db')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const Category = require('../src/models/Category')
const Product = require('../src/models/Product')
const User = require('../src/models/User')
const Order = require('../src/models/Order')

async function seed() {
  await connectDB()
  try {
    console.log('Clearing existing data...')
    await Promise.all([Category.deleteMany({}), Product.deleteMany({}), User.deleteMany({}), Order.deleteMany({})])

    const categoriesData = [
      { name: 'Broast', slug: 'broast', image: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=900&q=85' },
      { name: 'Burgers', slug: 'burgers', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=85' },
      { name: 'Chicken', slug: 'chicken', image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=900&q=85' },
      { name: 'Fries', slug: 'fries', image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=900&q=85' },
      { name: 'Deals', slug: 'deals', image: 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=900&q=85' },
      { name: 'Drinks', slug: 'drinks', image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=900&q=85' },
    ]
    const categories = await Category.insertMany(categoriesData)
    const catMap = new Map(categories.map((c) => [c.name, c._id]))

    const productsData = [
      { slug: 'signature-broast', name: 'Signature Broast', description: 'Golden, crunchy chicken marinated in our secret spice blend.', price: 690, category: catMap.get('Broast'), image: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=1200&q=85', ingredients: ['Crispy chicken', 'Signature herbs', 'Coleslaw', 'Fries'], isPopular: true },
      { slug: 'zinger-burger', name: 'BB Zinger Burger', description: 'Crispy chicken, creamy mayo and fresh lettuce in a toasted bun.', price: 520, originalPrice: 590, category: catMap.get('Burgers'), image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=85', ingredients: ['Chicken fillet', 'Lettuce', 'Mayo', 'Sesame bun'], isPopular: true, isDeal: true },
      { slug: 'malai-tikka', name: 'Malai Tikka', description: 'Tender boneless chicken, delicately seasoned and char-grilled.', price: 780, category: catMap.get('Chicken'), image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=1200&q=85', ingredients: ['Boneless chicken', 'Creamy marinade', 'Charred peppers'], isPopular: true },
      { slug: 'family-feast', name: 'Family Feast', description: 'A generous spread for sharing, with all the Bilal Broast favourites.', price: 1890, originalPrice: 2190, category: catMap.get('Deals'), image: 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1200&q=85', ingredients: ['8 pc chicken', '2 burgers', 'Fries', 'Drinks'], isDeal: true },
      { slug: 'masala-fries', name: 'Masala Fries', description: 'Crisp fries tossed in our bold house masala.', price: 260, category: catMap.get('Fries'), image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=1200&q=85', ingredients: ['Potatoes', 'House masala', 'Chaat seasoning'] },
      { slug: 'crunchy-wings', name: 'Crunchy Wings', description: 'Juicy wings with an irresistible peppery crunch.', price: 480, category: catMap.get('Chicken'), image: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=1200&q=85', ingredients: ['Chicken wings', 'Pepper spice', 'Crispy coating'] },
      { slug: 'mint-margarita', name: 'Mint Margarita', description: 'Cool, fizzy and freshly blended with mint and lime.', price: 220, category: catMap.get('Drinks'), image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=1200&q=85', ingredients: ['Fresh mint', 'Lime', 'Soda'] },
      { slug: 'weekend-box', name: 'Weekend Box', description: 'The perfect solo feast for a proper comfort-food craving.', price: 990, originalPrice: 1150, category: catMap.get('Deals'), image: 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=1200&q=85', ingredients: ['2 pc chicken', 'Zinger burger', 'Fries', 'Drink'], isDeal: true },
    ]
    const products = await Product.insertMany(productsData)

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@bilalbroast.test'
    const adminPassword = process.env.ADMIN_PASSWORD || 'changeme123'
    const demoEmail = 'demo@bilalbroast.test'
    const demoPassword = 'demo1234'

    const adminHash = await bcrypt.hash(adminPassword, 10)
    const demoHash = await bcrypt.hash(demoPassword, 10)

    const admin = await User.create({ name: 'Admin User', email: adminEmail, phone: '', passwordHash: adminHash, role: 'admin' })
    const demo = await User.create({ name: 'Demo Customer', email: demoEmail, phone: '', passwordHash: demoHash, role: 'customer' })

    console.log('Seed complete:')
    console.log(`  categories: ${categories.length}`)
    console.log(`  products: ${products.length}`)
    console.log(`  admin: ${admin.email} / password from .env or ADMIN_PASSWORD`) 
    console.log(`  demo: ${demo.email} / ${demoPassword}`)

  } catch (err) {
    console.error('Seeding error:', err)
  } finally {
    await mongoose.disconnect()
    process.exit(0)
  }
}

seed()
