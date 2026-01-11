# KTANE-Bombs

A website for tracking KTANE challenge bombs.

## bombdata

`bombdata` is a scrapper that uses HTML files from the challenge bomb spreadsheets so that that data can be imported.

## Developing

Install dependencies with `npm install` (or `pnpm install` or `yarn`).

Make a copy of the `.env.template` file and rename it to `.env`.

Inside that file set `DATABASE_URL` to point to your Postgres DB.

Run `npx prisma generate` to generate the prisma client.

Run `npx prisma migrate dev` to set up the database.

`cd importer` and run `npx tsx import.js` and `npx tsx importAdvanced.js` to fill your database
To wipe out your database before importing, run `npx prisma migrate reset`

To start a development server:
```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```
