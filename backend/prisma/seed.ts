import { prisma } from '../src/db/client.js';

/**
 * Seeds a single sample venue matching the worked examples in README-BE.md (10 rows x 12 columns),
 * plus a larger 10x50 venue matching the exact input example from the spec.
 */
async function main() {
  await prisma.bookingSeat.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.seat.deleteMany();
  await prisma.venue.deleteMany();

  await createVenue('Main Hall', 10, 12);
  await createVenue('Large Arena', 10, 50);
}

async function createVenue(name: string, rows: number, columns: number) {
  const venue = await prisma.venue.create({ data: { name, rows, columns } });

  const seats = [];
  for (let r = 0; r < rows; r++) {
    const row = indexToRow(r);
    for (let column = 1; column <= columns; column++) {
      seats.push({ venueId: venue.id, row, column });
    }
  }
  await prisma.seat.createMany({ data: seats });

  console.log(`Seeded venue "${name}" (${venue.id}) with ${seats.length} seats`);
}

function indexToRow(index: number): string {
  let n = index + 1;
  let result = '';
  while (n > 0) {
    const remainder = (n - 1) % 26;
    result = String.fromCharCode(97 + remainder) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
