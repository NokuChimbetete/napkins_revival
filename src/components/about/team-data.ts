// =============================================================================
// THE TEAM ROSTER — this is the only file you need to edit.
// =============================================================================
//
// Everything the "Meet the Team" section shows on /About-Us comes from the
// TEAM list below. The page reads this list and nothing else: there is no
// second copy of these names anywhere, and no row counts to keep in sync.
//
// -----------------------------------------------------------------------------
// TO CHANGE A PERSON
// -----------------------------------------------------------------------------
// Edit the line. One person is one line, and it looks like this:
//
//   { name: "Jan", pronouns: "he/him", role: "Finance Person", photo: "/assets/team/jan.jpg" },
//
//   name      shown in black
//   pronouns  shown in black next to the name, in brackets. Leave it as ""
//             (two quote marks, nothing between) if they don't use pronouns —
//             the brackets then disappear on their own. See Emma below.
//   role      shown in grey underneath
//   photo     path to the picture, always starting with /assets/team/
//
// Keep the commas and the quote marks exactly where they are.
//
// -----------------------------------------------------------------------------
// TO ADD A NEW PHOTO
// -----------------------------------------------------------------------------
// Put the image file in this folder:
//
//   public/assets/team/
//
// Name it after the person, lower-case, with a dash instead of a space, and
// keep the .jpg on the end:  zhi-zhi.jpg,  jan.jpg,  mariam.jpg
//
// Then in the entry write that same name after /assets/team/ — so a file saved
// as public/assets/team/sofia.jpg is written as photo: "/assets/team/sofia.jpg".
//
// Any shape of picture works. Tall, wide, phone screenshot — the page crops it
// to a square from the centre, so nothing ever comes out stretched. A picture
// about 600x600 or larger looks sharpest; smaller than that may go fuzzy.
//
// -----------------------------------------------------------------------------
// ADDING OR REMOVING PEOPLE
// -----------------------------------------------------------------------------
// Add a person by copying any line and changing it. Remove one by deleting its
// whole line. You do not have to keep the number at 15, and you do not have to
// balance the rows.
//
// The page puts five people on a row and starts a new row by itself. So a 16th
// person simply begins a fourth row on the left, and that row stays left-
// aligned with one person on it — it will not stretch to fill the width. Take
// someone out and the people after them shift back to close the gap. Four on a
// row, or seven people in total, or one, all lay out correctly.
//
// The order below is the order they appear on the page, left to right, top to
// bottom. Move a line to move that person.
//
// (This mirrors how src/components/landing/collage-data.ts feeds the collage on
// the landing page.)
// =============================================================================

export type TeamMember = {
  name: string;
  /** Empty string means no pronouns — the brackets are then omitted entirely. */
  pronouns: string;
  role: string;
  /** Path under public/, e.g. "/assets/team/jan.jpg". Cropped square, centred. */
  photo: string;
};

export const TEAM: TeamMember[] = [
  // --- row 1 ---------------------------------------------------------------
  { name: "Zhi Zhi", pronouns: "she/her", role: "Directorette", photo: "/assets/team/zhi-zhi.jpg" },
  { name: "Daria", pronouns: "she/her", role: "Editor-in-Chief", photo: "/assets/team/daria.jpg" },
  { name: "Almira", pronouns: "she/her", role: "Literary Editor", photo: "/assets/team/almira.jpg" },
  { name: "Ari", pronouns: "they/them", role: "Editor-in-Chief", photo: "/assets/team/ari.jpg" },
  { name: "Emma", pronouns: "", role: "Literary Editor", photo: "/assets/team/emma.jpg" },

  // --- row 2 ---------------------------------------------------------------
  { name: "Dasha", pronouns: "she/her", role: "Directorette", photo: "/assets/team/dasha.jpg" },
  { name: "Mariam", pronouns: "she/her", role: "Art Editor", photo: "/assets/team/mariam.jpg" },
  { name: "Elfriede", pronouns: "she/her", role: "Literary Editor", photo: "/assets/team/elfriede.jpg" },
  { name: "Jaime", pronouns: "he/him", role: "Art Editor", photo: "/assets/team/jaime.jpg" },
  { name: "Miray", pronouns: "she/her", role: "Literary Editor", photo: "/assets/team/miray.jpg" },

  // --- row 3 ---------------------------------------------------------------
  { name: "Fabian", pronouns: "he/him", role: "Literary Editor", photo: "/assets/team/fabian.jpg" },
  { name: "Mara", pronouns: "she/her", role: "Art Editor", photo: "/assets/team/mara.jpg" },
  { name: "Jan", pronouns: "he/him", role: "Finance Person", photo: "/assets/team/jan.jpg" },
  { name: "Echo", pronouns: "she/her", role: "Layout Artist", photo: "/assets/team/echo.jpg" },
  { name: "Yuya", pronouns: "she/her", role: "Web Designer", photo: "/assets/team/yuya.jpg" },
];
