// =============================================================================
// FRACTAL'S SIX SPACES — one page each, at /Events/fractal/<name>.
// =============================================================================
//
// Reached from "Explore Spaces" at the end of the Fractal part of /Events.
// The six link to each other in a loop, in the order below: the last one's
// "next space" is the first one again.
//
//   Lungs -> Waves -> Engine -> Web -> Golden Ratio -> Synergy -> Lungs
//
// Reordering this list reorders both the loop and the "Explore Spaces" links.
// The `slug` is the web address, so changing one changes that page's link.
//
// -----------------------------------------------------------------------------
// HOW A PAGE IS BUILT
// -----------------------------------------------------------------------------
// Each space has a title, an opening paragraph, one wide picture, and then a
// list of `rows`. A row is one of four kinds:
//
//   { kind: "prose",   text: [...] }        one column, full width
//   { kind: "columns", left: {...},         two columns side by side; each side
//                      right: {...} }       can hold pictures and paragraphs
//   { kind: "gallery", ... }                the draggable "move us around!"
//                                           pile of photographs
//   { kind: "verse",   lines: [...] }       the short centred lines on Waves
//
// -----------------------------------------------------------------------------
// THE DRAGGABLE GALLERIES
// -----------------------------------------------------------------------------
// The numbers in a gallery are the ones the old Cargo site used, and they are
// worth understanding before changing any:
//
//   height   how tall the whole pile is, as a percentage of its width
//   x, y     where a photograph's top-left corner sits, both measured as a
//            percentage of the pile's WIDTH (not its height — that is what
//            makes the pile keep its shape at any screen size)
//   width    how wide that photograph is, as a percentage of the pile's width
//   z        which photograph sits on top when they overlap; higher is nearer
//
// Visitors can drag the photographs around. Dragging never saves — a reload
// puts them back exactly here. On a narrow phone the pile becomes a plain
// two-column grid instead, because dragging in a scrolling page fights the
// scroll.
//
// Synergy has no gallery. It never did on the old site: its photographs were
// laid out in plain columns, and that has been kept as it was.
//
// =============================================================================

import type { EventImageKey } from "./event-images";
import type { Picture } from "./events-data";

/** One photograph in a draggable pile. See the note above about the units. */
export type GalleryItem = Picture & {
  width: number;
  x: number;
  y: number;
  z: number;
};

export type Cell = {
  pictures?: Picture[];
  text?: string[];
};

export type Row =
  | { kind: "prose"; heading?: string; text: string[] }
  | { kind: "columns"; left: Cell; right: Cell }
  | { kind: "gallery"; height: number; items: GalleryItem[]; verse?: string[] };

export type Space = {
  slug: string;
  title: string;
  /** the paragraphs directly under the title; most spaces have one */
  lede: string[];
  hero: Picture;
  rows: Row[];
  materials: string;
  designer: string;
};

export const SPACES: Space[] = [
  // ---------------------------------------------------------------- Lungs ---
  {
    slug: "lungs",
    title: "Lungs",
    lede: ["Lungs is the Entrance Room. This is where we welcome participants! Every participant will contribute to a collective art piece upon entry—they will receive a napkin to submit to the Engine Room."],
    hero: {
      image: "spaces/4o0a4797",
      alt: "Visitors standing in a darkened room watching a projected image of branching bronchial tubes on the wall.",
    },
    rows: [
      {
        kind: "prose",
        text: [
          "Our lungs have a fractal pattern, as they need as much space as possible for the oxygen to flow and keep us alive – fractals within our lungs maximize the amount of space given. The fractal pattern is simple: one branch splits into two branches half the length at 45 degrees angle, compromising the trachea, bronchi, bronchioles, and alveoli.",
        ],
      },
      {
        kind: "columns",
        left: {
          pictures: [
            {
              image: "spaces/img000-1",
              alt: "A diagram of a branching fractal tree, drawn in fine black line.",
            },
          ],
        },
        right: {
          pictures: [
            {
              image: "spaces/img000",
              alt: "A second fractal branching diagram, denser than the first.",
            },
          ],
        },
      },
      {
        kind: "gallery",
        height: 62.5,
        items: [
          {
            image: "spaces/4o0a4712",
            alt: "A visitor writing on a napkin at the entrance table.",
            width: 30,
            x: 67.5,
            y: 42.5,
            z: 1,
          },
          {
            image: "spaces/4o0a4845",
            alt: "The projection filling the wall of the darkened entrance room.",
            width: 45,
            x: 50,
            y: 0,
            z: 2,
          },
          {
            image: "spaces/4o0a4847",
            alt: "A dark curtain drawn across the doorway into the room.",
            width: 32.5,
            x: 40,
            y: 12.5,
            z: 3,
          },
          {
            image: "spaces/4o0a4597",
            alt: "The bronchial projection seen from across the room, with visitors silhouetted against it.",
            width: 57.5,
            x: 0,
            y: 0,
            z: 4,
          },
        ],
      },
    ],
    materials:
      "Projector, laptop, Speaker, Fabric (dark, long enough for curtains at the door).",
    designer: "Annabel Schön",
  },

  // ---------------------------------------------------------------- Waves ---
  {
    slug: "waves",
    title: "Waves",
    lede: ["This room is all about streams of consciousness. Participants come into the room and write poetry on napkins. They will attach the napkins onto one of the strings that extend from one side of the wall to another. The strings are hung in a wave shape. So, in the end, there will be “waves” of napkins with poetry written on them exhibited."],
    hero: {
      image: "spaces/4o0a4803",
      alt: "Napkins pegged along strings strung in a wave across the room, lit by candles and fairy lights.",
    },
    rows: [
      {
        kind: "columns",
        left: {
          text: [
            "Participants can",
            "1) write their incidental thoughts at the moment unprompted;",
            "2) write a response to the various prompts pasted on the front wall.",
          ],
        },
        right: {
          pictures: [
            {
              image: "spaces/4o0a4841",
              alt: "Three visitors writing at a low table by candlelight, napkins and pens spread in front of them.",
            },
          ],
        },
      },
      {
        kind: "gallery",
        height: 33.33,
        items: [
          {
            image: "spaces/4o0a4921",
            alt: "A close view of napkins hanging from a string, each covered in handwriting.",
            width: 50,
            x: 52.5,
            y: 0,
            z: 1,
          },
          {
            image: "spaces/4o0a5104",
            alt: "Prompts pasted across the front wall of the poetry room.",
            width: 30,
            x: 0,
            y: 0,
            z: 2,
          },
          {
            image: "spaces/4o0a4601",
            alt: "The waves of strung napkins seen along the length of the room.",
            width: 40,
            x: 22.5,
            y: 5,
            z: 3,
          },
        ],
      },
      {
        kind: "gallery",
        height: 52.5,
        verse: [
          "Stream-of-consciousness",
          "reflects the nature of our thought processes.",
          "We usually let those thoughts pass.",
          "As a result, many potentially powerful ideas are lost.",
          "When we encode our thoughts onto a piece of paper,",
          "the stream of consciousness finds its form.",
        ],
        items: [
          {
            image: "spaces/4o0a4583",
            alt: "A single napkin hanging from its string, a poem written across it.",
            width: 35,
            x: 60,
            y: 0,
            z: 1,
          },
        ],
      },
    ],
    materials:
      "Napkins, pens and markers (lots of them!), (invisible) strings, candles, fairy lights.",
    designer: "Zhi Zhi Chia",
  },

  // --------------------------------------------------------------- Engine ---
  {
    slug: "engine",
    title: "Engine",
    lede: ["This room is an interactive kinetic art installation. Engine consists of four towers, one loop of string that binds together those towers, and a centerpiece. The towers are placed at the corners of the room in which the Engine is installed. Each tower is approximately as tall as an average person. On top of each tower sits a plastic water barrel where the string is looped. The barrels are not physically attached to the tower, but are rather filled with water to add weight. One tower has its barrel rotating using a motor-driven shaft that operates on commercial power banks via Arduino. This barrel acts to rotate the string across all the towers."],
    hero: {
      image: "spaces/4o0a4868",
      alt: "One of the Engine's wooden towers, a clear water barrel resting on top with string looped around it.",
    },
    rows: [
      {
        kind: "columns",
        left: {
          pictures: [
            {
              image: "spaces/4o0a4669",
              alt: "Napkins clipped along the rotating string loop.",
            },
            {
              image: "spaces/4o0a4632",
              alt: "The motor-driven shaft mounted under one of the barrels.",
            },
          ],
          text: [
            "During the exhibition, some napkins with various writings and visual art from previous collections and published magazines will be attached to the string loop.",
            "The centerpiece sits in the middle of the installation space, housing two chairs, two tables, and one projector. A supervisor will sit inside the centerpiece, and will examine the napkins attached to the string. The supervisor will then freely choose the napkin they would like to project onto a wall, and will do so at random times throughout the exhibition.",
          ],
        },
        right: {
          pictures: [
            {
              image: "spaces/4o0a4804",
              alt: "The centerpiece structure with its projector aimed at the wall.",
            },
            {
              image: "spaces/4o0a4869",
              alt: "A napkin projected large across the gallery wall.",
            },
          ],
          text: [
            "The string loop’s rotation will happen at all times during the exhibition, where incoming viewers will be able to create their own writings and visual art on a napkin and attach it to the string loop. Incoming viewers will also be able to attach their responses to existing napkins.",
            "Both the towers and the centerpiece are constructed using wooden slabs of similar sizes. All supplies excluding the motor-driven shaft will be already existing, provided and be reusable by Studio94.",
          ],
        },
      },
      {
        kind: "gallery",
        height: 83.75,
        items: [
          {
            image: "spaces/4o0a4980",
            alt: "A wooden dress clip holding a napkin to the string.",
            width: 17.5,
            x: 75,
            y: 47.5,
            z: 1,
          },
          {
            image: "spaces/4o0a4642",
            alt: "The full Engine installation seen across the room, string running between all four towers.",
            width: 47.5,
            x: 52.5,
            y: 0,
            z: 2,
          },
          {
            image: "spaces/4o0a4664",
            alt: "A visitor reaching up to clip their napkin onto the moving string.",
            width: 30,
            x: 35,
            y: 7.5,
            z: 3,
          },
          {
            image: "spaces/4o0a4771",
            alt: "The supervisor seated inside the centerpiece, choosing a napkin to project.",
            width: 37.5,
            x: 50,
            y: 35,
            z: 4,
          },
          {
            image: "spaces/4o0a4638",
            alt: "A tower corner, with the water barrel and looped string above.",
            width: 32.5,
            x: 7.5,
            y: 35,
            z: 5,
          },
          {
            image: "spaces/4o0a4813",
            alt: "Napkins travelling along the loop, caught mid-rotation.",
            width: 42.5,
            x: 0,
            y: 5,
            z: 6,
          },
        ],
      },
      {
        kind: "prose",
        text: [
          "The engine is a collection of ideas from viewers, participants, and editors. Its movement is a physical symbol of fractal because it combines the ideas into one “beating heart”.",
        ],
      },
    ],
    materials:
      "Napkins, wooden blocks, shaft, large plastic water barrels, wooden dress clips, 9V Power supply, MOSFET transistor, Potentiometer, rubber bands, projector.",
    designer: "Sun Kim",
  },

  // ------------------------------------------------------------------ Web ---
  {
    slug: "web",
    title: "Web",
    lede: ["This is the collage room. Participants start with anchor points of preexisting collage. Wired fence will be cut in various shapes and sizes. Guests then create a collage on top of the wire by wrapping clothes/paper and other materials. After they complete their individual piece, they will bend their wired fence and attach it to a larger piece stationed in the center of the exhibit. The central piece will start with a wire base that looks like a cob/tangled spider web, and with additional wires and supports, attach their piece to expand the web. The piece will be hanging via string/wire and a pulley system using can be used to lift the piece up and down– up for display, and down to attach new pieces."],
    hero: {
      image: "spaces/4o0a5101",
      alt: "The hanging central web, a tangle of wire and collaged paper suspended above the room.",
    },
    rows: [
      {
        kind: "columns",
        left: {
          pictures: [
            {
              image: "spaces/4o0a5004",
              alt: "A visitor weaving torn magazine paper through a piece of wire fence.",
            },
            {
              image: "spaces/4o0a4829",
              alt: "Cut squares of wire fence laid out with glue, scissors and coloured paper.",
            },
            {
              image: "spaces/4o0a4743",
              alt: "A finished individual collage panel, ready to be added to the web.",
            },
          ],
          text: [
            "This room points to the web of our identity, which is a malleable interplay between the individual and larger social setting. A person is a single woven strand that cumulatively creates an ornate web of connections and larger societal image.",
          ],
        },
        right: {
          pictures: [
            {
              image: "spaces/4o0a4734",
              alt: "Hands bending a wire panel to hook it onto the central structure.",
            },
            {
              image: "spaces/4o0a4775",
              alt: "The web lowered on its pulley so a new piece can be attached.",
            },
          ],
          text: [
            "In the final hour of the event time (or after the exhibition), strings will be added to define boundaries or extend boundaries to replicate the fractal of a web (i.e. how a web looks like).",
          ],
        },
      },
      {
        kind: "gallery",
        height: 83.33,
        items: [
          {
            image: "spaces/4o0a5082",
            alt: "The completed web hanging at full height, lit from below.",
            width: 80,
            x: 10,
            y: 30,
            z: 1,
          },
          {
            image: "spaces/4o0a4838",
            alt: "A detail of wire and paper knotted together.",
            width: 20,
            x: 0,
            y: 45,
            z: 2,
          },
          {
            image: "spaces/4o0a4992",
            alt: "A visitor holding up their finished panel.",
            width: 27.5,
            x: 72.5,
            y: 25,
            z: 3,
          },
          {
            image: "spaces/4o0a4613",
            alt: "Magazine cuttings and fabric scraps spread across the work table.",
            width: 25,
            x: 57.5,
            y: 2.5,
            z: 4,
          },
          {
            image: "spaces/4o0a4991",
            alt: "The web seen from directly beneath, strands radiating outward.",
            width: 35,
            x: 5,
            y: 0,
            z: 5,
          },
        ],
      },
    ],
    materials:
      "Napkins, wired fence, old magazines, glue sticks, soft glue, hot glue guns, colored papers, scissors, scoth tape, permanent markers, fabric/scrap clothing.",
    designer: "Stephanie Froebel",
  },

  // --------------------------------------------------------- Golden Ratio ---
  {
    slug: "golden-ratio",
    title: "Golden Ratio",
    lede: ["Golden Ratio is a collaborative installation. This room hosts a transparent diorama installation. The diorama will be completed over the course of the event. The start will be one sheet of transparent paper/plexiglass, hung at eye level. New layers will be added with new illustrations, done by visitors under guidance. The entire installation would create a tunnel effect down the length of the room. Idea for prompt: first slide is a contour map of the world. Added layer in front either adds to the map or restructures it slightly, based on: your understanding of home, your understanding of global connection, global history politics, knowledge."],
    hero: {
      image: "spaces/4o0a4783",
      alt: "Sheets of semi-transparent fabric hung in a row down the room, each drawn on, forming a tunnel.",
    },
    rows: [
      {
        kind: "columns",
        left: {
          pictures: [
            {
              image: "spaces/4o0a4677",
              alt: "A visitor drawing onto one of the hanging transparent sheets with a marker.",
            },
            {
              image: "spaces/4o0a4616",
              alt: "The layered sheets seen edge-on, drawings overlapping into depth.",
            },
          ],
          text: [
            "This installation is inspired by hand-drawn animation and diorama techniques. Each person’s idea should add to the previous people’s drawings but should also reflect what the prompt means to them.",
          ],
        },
        right: {
          pictures: [
            {
              image: "spaces/4o0a4748",
              alt: "A contour map of the world drawn on the first sheet in the sequence.",
            },
            {
              image: "spaces/4o0a4857",
              alt: "A later layer, its new lines redrawing the map underneath.",
            },
          ],
          text: [
            "A fractal is echoed in the production itself: each sheet is a piece on its own, but it is also part of a bigger artwork both temporally and visually.",
          ],
        },
      },
      {
        kind: "gallery",
        height: 152.5,
        items: [
          {
            image: "spaces/4o0a5098",
            alt: "The finished tunnel of drawn sheets, lit by standing lamps.",
            width: 80,
            x: 10,
            y: 32.5,
            z: 1,
          },
          {
            image: "spaces/4o0a4788",
            alt: "A detail of marker lines on semi-transparent fabric.",
            width: 20,
            x: 0,
            y: 47.5,
            z: 2,
          },
          {
            image: "spaces/4o0a4815",
            alt: "A visitor stepping between two of the hanging layers.",
            width: 35,
            x: 5,
            y: 0,
            z: 3,
          },
          {
            image: "spaces/4o0a4999",
            alt: "Cloth strings and wooden beams holding the sheets in place.",
            width: 30,
            x: 0,
            y: 40,
            z: 4,
          },
          {
            image: "spaces/4o0a4855",
            alt: "Layers seen from the far end of the room, drawings stacking into one image.",
            width: 30,
            x: 66.66,
            y: 40,
            z: 5,
          },
          {
            image: "spaces/4o0a4996",
            alt: "Two visitors conferring over what to add next.",
            width: 25,
            x: 52.5,
            y: 0,
            z: 6,
          },
          {
            image: "spaces/4o0a4786",
            alt: "Architect's markers laid out on a table beside the installation.",
            width: 30,
            x: 22.5,
            y: 22.5,
            z: 7,
          },
          {
            image: "spaces/4o0a5002",
            alt: "The tunnel at the end of the evening, every sheet drawn on.",
            width: 27.5,
            x: 70,
            y: 27.5,
            z: 8,
          },
        ],
      },
    ],
    materials:
      "Semi-transparent fabric, cloth strings, wooden beams, standing lamps, and architect’s markers.",
    designer: "Dasha Panasenko",
  },

  // -------------------------------------------------------------- Synergy ---
  {
    slug: "synergy",
    title: "Synergy",
    // Both of these sit under the title on the original, not in the body.
    lede: [
      "This room is a multipurpose space. Synergy occurred between painters and the audience. The synergy art is created with different medium of expression happening harmoniously at the same time. For example, a pianist will be improvising on the piano while a dancer dances to the music and an artist makes a sketch of the dancer.",
      "The space will also be where food is at. At the end of the exhibition, everyone comes together and each room designer will present some of the works created today in their rooms.",
    ],
    hero: {
      image: "spaces/4o0a4918",
      alt: "A dancer mid-movement on a large sheet of paper while a painter works at the edge of it and an audience watches from the floor.",
    },
    rows: [
      {
        kind: "columns",
        left: {
          pictures: [
            { image: "spaces/4o0a4872", alt: "A pianist improvising at an upright piano." },
            { image: "spaces/4o0a4769", alt: "A dancer moving across the paper floor." },
          ],
        },
        right: {
          pictures: [
            { image: "spaces/4o0a4820", alt: "A painter sketching the dancer in charcoal." },
            { image: "spaces/4o0a4917", alt: "The audience seated around the edge of the room, watching." },
          ],
        },
      },
      {
        kind: "columns",
        left: {
          pictures: [
            { image: "spaces/4o0a4902", alt: "Charcoal marks accumulating across the large sheet." },
            { image: "spaces/4o0a4647", alt: "Brushes, inks and cups of water set out on the floor." },
            { image: "spaces/4o0a4968", alt: "Two painters working at opposite ends of the same sheet." },
            { image: "spaces/4o0a4889", alt: "A room designer presenting work made during the day." },
          ],
        },
        right: {
          pictures: [
            { image: "spaces/4o0a4893", alt: "A dancer and a painter working in the same moment." },
            { image: "spaces/4o0a4919", alt: "The finished painting laid flat, covered in marks from the session." },
            { image: "spaces/4o0a4908", alt: "Food and napkins spread on a table at the end of the exhibition." },
          ],
        },
      },
      {
        kind: "prose",
        heading: "Performers",
        text: [
          "Pianists: Leo Wu, Goga Endeladze",
          "Dancers: Viktoriia Danutsa, Jessica Cornez, Lexi Benakova",
          "Painters: Koosha Azim, Dasha Panasenko",
        ],
      },
    ],
    materials:
      "Pencils, charcoal sticks, erasers, A1 paper, inks, large paintbrushes, cups, salt, sugar, hairdryer, big canvas, paints, brushes, microphone, speaker, napkins, food.",
    designer: "Dasha Panasenko and Zhi Zhi Chia",
  },
];

/** What "Explore Spaces" lists at the end of the Fractal part of /Events —
 *  the thumbnail, and the one-line description beside it. */
export const SPACE_LINKS: { slug: string; blurb: string; image: EventImageKey }[] = [
  { slug: "lungs", blurb: "The Entrance/Collaborative Digital Arts Room", image: "fractal/4o0a4597-1" },
  { slug: "waves", blurb: "The Poetry Room", image: "fractal/4o0a4721" },
  { slug: "engine", blurb: "The Kinetic Art Room", image: "fractal/4o0a4663" },
  { slug: "web", blurb: "The Collage Room", image: "fractal/4o0a4814" },
  { slug: "golden-ratio", blurb: "Collaborative Installation", image: "fractal/4o0a4860" },
  {
    slug: "synergy",
    blurb: "dancers, pianists, and painters worked together to create artworks",
    image: "fractal/4o0a4887",
  },
];
