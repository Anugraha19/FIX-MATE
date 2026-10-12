'use strict';
// Demo data so the website looks populated right after setup.
//   admin    : admin@fixmate.com            / admin123
//   customers: meera@example.com ...        / password123
//   providers: rajesh@fixmate.com ...       / password123
const bcrypt = require('bcryptjs');

// YYYY-MM-DD for "today + offset days"
function day(offset) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const stamp = { createdAt: now, updatedAt: now };
    const adminHash = bcrypt.hashSync('admin123', 10);
    const userHash = bcrypt.hashSync('password123', 10);

    // ---------- categories ----------
    const categories = [
      [1, 'Plumbing', 'Leaks, pipes, taps, drains and bathroom fittings', 'tap'],
      [2, 'Electrical', 'Wiring, switches, fans, lights and safety checks', 'bolt'],
      [3, 'Carpentry', 'Doors, windows, furniture repair and assembly', 'hammer'],
      [4, 'Painting', 'Interior and exterior wall painting', 'roller'],
      [5, 'Appliance Repair', 'Washing machines, refrigerators and kitchen appliances', 'plug'],
      [6, 'AC Repair', 'AC servicing, gas refill and installation', 'snowflake'],
      [7, 'Cleaning', 'Deep cleaning for homes and kitchens', 'sparkle'],
      [8, 'Masonry', 'Tile work, wall repair, plastering and waterproofing', 'brick'],
      [9, 'Home Maintenance', 'General repair visits for small fixes around the house', 'home'],
    ].map(([id, name, description, image]) => ({ id, name, description, image, ...stamp }));
    await queryInterface.bulkInsert('categories', categories);

    // ---------- services ----------
    const services = [
      [1, 1, 'Leaking Tap & Pipe Repair', 'Find and fix leaking taps, joints and pipes. Includes basic washers and sealing material.', 349, 60, 'tap'],
      [2, 1, 'Bathroom Fitting Installation', 'Installation of wash basins, taps, showers and commodes with a leak test.', 799, 120, 'shower'],
      [3, 1, 'Drain Unblocking', 'Clear blocked kitchen and bathroom drains using safe mechanical tools.', 499, 90, 'drain'],
      [4, 2, 'Switchboard & Wiring Repair', 'Repair loose wiring, burnt switches and faulty sockets with a safety check.', 399, 60, 'bolt'],
      [5, 2, 'Fan & Light Installation', 'Install or replace ceiling fans, tube lights and decorative lights.', 299, 45, 'bulb'],
      [6, 3, 'Door & Window Repair', 'Fix hinges, locks, frames and alignment of wooden doors and windows.', 549, 90, 'door'],
      [7, 3, 'Furniture Assembly & Repair', 'Assemble new furniture or repair beds, tables, wardrobes and shelves.', 649, 120, 'hammer'],
      [8, 4, 'Interior Wall Painting (per room)', 'Surface preparation, putty and two coats of paint for one standard room.', 2499, 360, 'roller'],
      [9, 5, 'Washing Machine Repair', 'Diagnose and repair front-load and top-load washing machines.', 449, 60, 'washer'],
      [10, 5, 'Refrigerator Repair', 'Cooling problems, door seals, thermostat and compressor checks.', 549, 90, 'fridge'],
      [11, 6, 'AC Service & Gas Refill', 'Full AC cleaning, filter wash, gas check and refill if needed.', 899, 90, 'snowflake'],
      [12, 7, 'Deep Home Cleaning', 'Complete top-to-bottom cleaning for a 2BHK home, including kitchen and bathrooms.', 1999, 240, 'sparkle'],
      [13, 8, 'Tile & Wall Repair', 'Replace cracked tiles, fill wall cracks and repair plaster.', 899, 180, 'brick'],
      [14, 9, 'General Home Maintenance Visit', 'A technician visit for small jobs: hanging shelves, curtain rods, minor fixes.', 599, 120, 'home'],
    ].map(([id, category_id, name, description, price, duration, image]) => ({
      id, category_id, name, description, price, duration, image, is_active: true, ...stamp,
    }));
    await queryInterface.bulkInsert('services', services);

    // ---------- users: 1 admin, 6 customers, 6 providers ----------
    const users = [
      { id: 1, name: 'FixMate Admin', email: 'admin@fixmate.com', phone: '9800000001', password: adminHash, role: 'admin', address: 'FixMate Head Office, MG Road', city: 'Kochi' },
      { id: 2, name: 'Meera Nair', email: 'meera@example.com', phone: '9847000002', password: userHash, role: 'customer', address: 'Flat 4B, Lake View Apartments, Edappally', city: 'Kochi' },
      { id: 3, name: 'Arjun Das', email: 'arjun@example.com', phone: '9847000003', password: userHash, role: 'customer', address: '12/45 Temple Road, Aluva', city: 'Aluva' },
      { id: 4, name: 'Fathima Beevi', email: 'fathima@example.com', phone: '9847000004', password: userHash, role: 'customer', address: 'Green Villa, Kakkanad', city: 'Kochi' },
      { id: 5, name: 'Sanjay George', email: 'sanjay@example.com', phone: '9847000005', password: userHash, role: 'customer', address: '7 Market Street, Angamaly', city: 'Angamaly' },
      { id: 6, name: 'Priya Menon', email: 'priya@example.com', phone: '9847000006', password: userHash, role: 'customer', address: 'Sree Nivas, Thripunithura', city: 'Kochi' },
      { id: 7, name: 'Rahul Varma', email: 'rahul@example.com', phone: '9847000007', password: userHash, role: 'customer', address: '23 Church Lane, Perumbavoor', city: 'Perumbavoor' },
      { id: 8, name: 'Rajesh Kumar', email: 'rajesh@fixmate.com', phone: '9946000008', password: userHash, role: 'provider', address: 'Palarivattom', city: 'Kochi' },
      { id: 9, name: 'Anil Thomas', email: 'anil@fixmate.com', phone: '9946000009', password: userHash, role: 'provider', address: 'Edappally', city: 'Kochi' },
      { id: 10, name: 'Suresh Menon', email: 'suresh@fixmate.com', phone: '9946000010', password: userHash, role: 'provider', address: 'Aluva', city: 'Aluva' },
      { id: 11, name: 'Vineeth Nair', email: 'vineeth@fixmate.com', phone: '9946000011', password: userHash, role: 'provider', address: 'Ernakulam North', city: 'Kochi' },
      { id: 12, name: 'Faisal Rahman', email: 'faisal@fixmate.com', phone: '9946000012', password: userHash, role: 'provider', address: 'Kakkanad', city: 'Kochi' },
      { id: 13, name: 'Joseph Mathew', email: 'joseph@fixmate.com', phone: '9946000013', password: userHash, role: 'provider', address: 'Angamaly', city: 'Angamaly' },
    ].map((u) => ({ ...u, profile_image: null, is_active: true, ...stamp }));
    await queryInterface.bulkInsert('users', users);

    // ---------- providers ----------
    const providers = [
      [1, 8, 9, 'Pipe fitting, Leak repair, Bathroom fittings, Drain cleaning', 'Kochi', 'available'],
      [2, 9, 7, 'House wiring, Switchboards, Fan installation, Safety checks', 'Kochi', 'available'],
      [3, 10, 12, 'Door repair, Furniture making, Polishing, Assembly', 'Aluva', 'available'],
      [4, 11, 8, 'Interior painting, Texture finish, Wall putty, Waterproof coats', 'Kochi', 'busy'],
      [5, 12, 6, 'Washing machine, Refrigerator, Split AC servicing, Gas refill', 'Kochi', 'available'],
      [6, 13, 10, 'Deep cleaning, Tile work, Plastering, Minor repairs', 'Angamaly', 'available'],
    ].map(([id, user_id, experience, skills, location, availability_status]) => ({
      id, user_id, experience, skills, location, availability_status, rating: 0, ...stamp,
    }));
    await queryInterface.bulkInsert('providers', providers);

    // ---------- provider_services (which provider offers which service) ----------
    const offers = { 1: [1, 2, 3], 2: [4, 5], 3: [6, 7], 4: [8], 5: [9, 10, 11], 6: [12, 13, 14] };
    const providerServices = [];
    Object.entries(offers).forEach(([providerId, serviceIds]) => {
      serviceIds.forEach((serviceId) => {
        providerServices.push({ provider_id: Number(providerId), service_id: serviceId, ...stamp });
      });
    });
    await queryInterface.bulkInsert('provider_services', providerServices);

    // ---------- availability windows ----------
    await queryInterface.bulkInsert('availability', [
      { provider_id: 1, available_date: day(1), start_time: '09:00:00', end_time: '17:00:00', is_available: true, ...stamp },
      { provider_id: 1, available_date: day(2), start_time: '09:00:00', end_time: '13:00:00', is_available: true, ...stamp },
      { provider_id: 2, available_date: day(1), start_time: '10:00:00', end_time: '18:00:00', is_available: true, ...stamp },
      { provider_id: 5, available_date: day(1), start_time: '08:00:00', end_time: '16:00:00', is_available: true, ...stamp },
      { provider_id: 5, available_date: day(3), start_time: '08:00:00', end_time: '12:00:00', is_available: true, ...stamp },
      { provider_id: 6, available_date: day(2), start_time: '09:00:00', end_time: '17:00:00', is_available: true, ...stamp },
    ]);

    // ---------- bookings in many different statuses ----------
    const price = {};
    services.forEach((s) => { price[s.id] = s.price; });
    const bookings = [
      // id, customer, provider, service, date offset, time, status, problem
      [1, 2, 1, 1, -10, '10:00:00', 'Completed', 'Kitchen tap is dripping all night.'],
      [2, 3, 2, 4, -8, '11:00:00', 'Completed', 'Switchboard in the hall sparks when I plug anything in.'],
      [3, 4, 5, 11, -6, '09:00:00', 'Completed', 'AC is not cooling properly since last week.'],
      [4, 5, 3, 6, -4, '14:00:00', 'Completed', 'Bedroom door does not close, hinge is loose.'],
      [5, 6, 4, 8, -3, '09:00:00', 'Completed', 'Repaint the living room before a family function.'],
      [6, 2, 5, 9, 1, '10:00:00', 'Accepted', 'Washing machine makes loud noise while spinning.'],
      [7, 3, 1, 3, 2, '11:00:00', 'Pending', 'Bathroom drain is blocked and water is not going down.'],
      [8, 4, null, 12, 3, '09:00:00', 'Pending', 'Need deep cleaning of a 2BHK before moving in.'],
      [9, 5, 6, 14, 2, '11:00:00', 'Assigned', 'Hang curtain rods and fix two loose shelves.'],
      [10, 6, 2, 5, 0, '16:00:00', 'In Progress', 'Install two ceiling fans in the bedrooms.'],
      [11, 7, 5, 10, -2, '13:00:00', 'Cancelled', 'Refrigerator not cooling. Cancelled, repaired by neighbour.'],
      [12, 7, 3, 7, -5, '10:00:00', 'Rejected', 'Wardrobe door hinge repair and re-alignment.'],
      [13, 2, 6, 12, 5, '09:00:00', 'Confirmed', 'Festival deep clean for the full house.'],
      [14, 3, 1, 2, -1, '12:00:00', 'Completed', 'Install a new wash basin and mixer tap.'],
    ].map(([id, customer, provider, service, offset, time, status, problem]) => {
      const customerUser = users.find((u) => u.id === customer);
      return {
        id,
        customer_id: customer,
        provider_id: provider,
        service_id: service,
        booking_date: day(offset),
        booking_time: time,
        address: customerUser.address,
        problem_description: problem,
        notes: null,
        estimated_price: price[service],
        status,
        ...stamp,
      };
    });
    await queryInterface.bulkInsert('bookings', bookings);

    // ---------- reviews for completed bookings ----------
    const reviews = [
      [1, 1, 2, 1, 5, 'Rajesh found the leak in minutes and fixed it neatly. Arrived on time.'],
      [2, 2, 3, 2, 4, 'Good work on the wiring. Explained what was wrong and cleaned up after.'],
      [3, 3, 4, 5, 5, 'The AC feels brand new. Very professional and polite.'],
      [4, 4, 5, 3, 4, 'Door works perfectly now. Took a little longer than planned.'],
      [5, 5, 6, 4, 5, 'Beautiful finish and the room was left spotless. Highly recommended.'],
      [6, 14, 3, 1, 5, 'Quick installation and no leaks. Will book again.'],
    ].map(([id, booking_id, customer_id, provider_id, rating, comment]) => ({
      id, booking_id, customer_id, provider_id, rating, comment, ...stamp,
    }));
    await queryInterface.bulkInsert('reviews', reviews);

    // ---------- provider rating = average of their review ratings ----------
    await queryInterface.sequelize.query(
      `UPDATE providers
          SET rating = COALESCE((SELECT ROUND(AVG(r.rating), 1) FROM reviews r WHERE r.provider_id = providers.id), 0)`
    );
  },

  async down(queryInterface) {
    // delete in reverse order of the foreign keys
    await queryInterface.bulkDelete('reviews', null, {});
    await queryInterface.bulkDelete('bookings', null, {});
    await queryInterface.bulkDelete('availability', null, {});
    await queryInterface.bulkDelete('provider_services', null, {});
    await queryInterface.bulkDelete('providers', null, {});
    await queryInterface.bulkDelete('users', null, {});
    await queryInterface.bulkDelete('services', null, {});
    await queryInterface.bulkDelete('categories', null, {});
  },
};
