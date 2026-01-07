import { db } from "./db";
import { users, expensePolicies, clients, projects } from "@shared/schema";
import bcrypt from "bcrypt";

async function seed() {
  console.log("Starting database seed...");

  try {
    // Check if users already exist
    const existingUsers = await db.select().from(users);
    if (existingUsers.length > 0) {
      console.log("Database already seeded, skipping...");
      return;
    }

    // Hash password for demo accounts
    const passwordHash = await bcrypt.hash("Password123!", 10);

    // Create demo users
    await db.insert(users).values([
      {
        email: "admin@yds.in",
        passwordHash,
        fullName: "Admin User",
        role: "ADMIN",
        isActive: true,
      },
      {
        email: "manager@yds.in",
        passwordHash,
        fullName: "Manager User",
        role: "MANAGER",
        isActive: true,
      },
      {
        email: "sales1@yds.in",
        passwordHash,
        fullName: "Sales Rep One",
        role: "SALES",
        isActive: true,
      },
      {
        email: "sales2@yds.in",
        passwordHash,
        fullName: "Sales Rep Two",
        role: "SALES",
        isActive: true,
      },
      {
        email: "proj1@yds.in",
        passwordHash,
        fullName: "Project Rep One",
        role: "PROJECTS",
        isActive: true,
      },
    ]);
    console.log("Created demo users");

    // Create expense policy
    await db.insert(expensePolicies).values([
      {
        name: "Standard Travel Policy 2024",
        ratePerKm: "10.00",
        minAccuracyM: 80,
        pingIntervalSec: 60,
        geofenceDefaultM: 150,
        isActive: true,
        effectiveFrom: "2024-01-01",
      },
    ]);
    console.log("Created expense policy");

    // Create sample clients (using schema columns)
    await db.insert(clients).values([
      {
        name: "ABC Industries Pvt Ltd",
        phone: "+91 98765 43210",
        email: "rajesh@abcindustries.in",
        city: "Gurgaon",
      },
      {
        name: "XYZ Construction Co",
        phone: "+91 98765 43211",
        email: "priya@xyzconstruction.in",
        city: "Noida",
      },
      {
        name: "Delta Manufacturing",
        phone: "+91 98765 43212",
        email: "vikram@deltamfg.in",
        city: "Faridabad",
      },
    ]);
    console.log("Created sample clients");

    // Create sample projects (using schema columns)
    await db.insert(projects).values([
      {
        projectCode: "PRJ-2024-001",
        siteAddressText: "123 Industrial Area, Phase 2, Gurgaon, Haryana",
        siteLat: "28.4595",
        siteLng: "77.0266",
        status: "ACTIVE",
      },
      {
        projectCode: "PRJ-2024-002",
        siteAddressText: "456 Construction Plaza, Noida, UP",
        siteLat: "28.5355",
        siteLng: "77.3910",
        status: "ACTIVE",
      },
      {
        projectCode: "PRJ-2024-003",
        siteAddressText: "789 Manufacturing Hub, Faridabad, Haryana",
        siteLat: "28.4089",
        siteLng: "77.3178",
        status: "ACTIVE",
      },
    ]);
    console.log("Created sample projects");

    console.log("Seed completed successfully!");
  } catch (error) {
    console.error("Seed error:", error);
  }
}

seed();
