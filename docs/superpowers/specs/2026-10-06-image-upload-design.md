# Photo upload

Date: 2026-10-06
Status: approved, ready to implement

## Intent

Photographs are how a bar records what it cannot write down: what the display
should look like, how a garnish is cut, which of four similar bottles is the one
being counted. Today both places that want a picture — the bar book's gallery and
a product — take a pasted URL, which means having the photo hosted somewhere
already. Nobody standing behind a bar with a phone has that.

Success: from a phone, one tap opens the camera or the photo library, and the
picture is attached.

## Decisions

- **Files live in MongoDB via GridFS**, in the tenant's own database. No account
  to open and no new secrets, and it survives Render restarts — the server's
  filesystem does not, which rules out writing uploads to disk.
- **Permissions follow the existing rules.** Gallery photos need an admin in edit
  mode like every other bar book change; product photos follow product editing.
  No new permission concept.
- **Images are never embedded in the bar book document.** It is a single JSON doc
  saved whole on every checkbox tick, against a 16MB cap. Pages store an id; the
  bytes live in GridFS.

## Constraints that shape it

A phone photo is 3-8MB. Stored as-is, a few hundred would fill an Atlas free
tier, and every bar book load would drag them along. So:

- **The browser downscales before upload**: longest edge 1280px, JPEG quality
  0.82, which puts a typical photo near 200KB.
- **The server enforces its own limits** regardless of what the client did:
  image types only, and a ceiling on stored size. A client is not to be trusted
  to have shrunk anything.

`express.json` is already configured at 5mb, so the upload travels as a base64
data URL in ordinary JSON and the project gains no multipart dependency.

## Storage

`services/imageStore.service.js` owns the bucket:

- `saveImage(dbName, dataUrl)` → `{ id, contentType, size }`
- `openImage(dbName, id)` → stream + metadata, or null
- `deleteImages(dbName, ids)` — tolerant of ids that are already gone

The bucket lives in the tenant database, so isolation needs no checks of its own:
an id belonging to another bar is simply not found in this bar's bucket.

## API

- `POST /api/image` — authenticated. Body `{ data: "<data url>" }`. Returns
  `{ url: "/api/image/<id>" }`.
- `GET /api/image/:id` — authenticated, streams the bytes with a long cache
  header, since an id's content never changes.

## Not leaving orphans

Storage is the database here, so unreferenced files matter.

- **Bar book:** `save` already loads the current document for conflict detection.
  Comparing the image ids referenced before and after a save gives exactly the
  set that was removed, which is then deleted.
- **Products:** replacing or clearing a product's image deletes the one it
  replaced; deleting a product deletes its image.

## Client

`ImagePicker` — a button over a hidden `<input type="file" accept="image/*">`.
No `capture` attribute: left off, phones offer both the camera and the library,
which is what was asked for. It downscales, uploads, reports progress, and hands
back a URL.

It appears in the gallery page beside the existing address field, and in the
product edit form. The address field stays: a photo that is already hosted is
still worth linking, and removing that would be a regression.

## Error handling

A file that is not an image, or is too large after downscaling, is refused in the
browser with a message, and refused again on the server. A failed upload leaves
the field as it was.

## Verification

No test runner. `npm run lint`, then in the browser, against a demo tenant rather
than a real bar:

1. Uploading a photo in the gallery shows it, and it survives a reload.
2. Uploading on a product shows it in the product list.
3. A large photo arrives downscaled — stored size well under the original.
4. A non-image file is refused.
5. Removing a gallery photo deletes its file; the bucket does not grow forever.
6. An image id from another tenant is not readable.

## Out of scope

Cropping, rotation, multiple images per product, and replacing the existing
pasted-URL fields.
