Restore & Edit Road - Quick Instructions

1) Apply Prisma migration locally (adds `color` column):

   cd backend
   npx prisma migrate deploy

   or during development:

   npx prisma migrate dev --name add_color_to_road

2) Start backend server (if not running):

   cd backend
   npm run dev   # or however you normally start the server

3) Test the geojson endpoint (should include `color` property):

   curl http://localhost:4000/api/roads/geojson | jq '.features[0].properties'

4) Open the frontend and go to the User map. Use the "Edit road" button (pencil icon) to toggle edit mode.
   - Click a road to select it (the selected road will be highlighted).
   - Edit the name and choose a color, then Save.

5) Save triggers `PUT /api/roads/:id` with JSON payload { nameroad, color }.

Notes:
- If you prefer safer matching for restore, review `backend/scripts/restore-road-geometry-by-proximity.cjs`.
- The `color` column in the database is optional (VARCHAR(50)).

If you want, I can:
- Run the migration here (if you want me to run prisma migrate commands),
- Add server-side validation for `color` and `nameroad`,
- Add an audit log for road edits.
