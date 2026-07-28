// Pieces that can't be scraped because the old site's page is gone.
// scrape-issue.mjs merges these in at `after_slug`, so re-scraping never
// loses them.
//
// Each entry mirrors the shape the scraper produces. `body_html` uses the same
// small HTML subset as scraped pieces: <br> for line breaks, <br><br> between
// paragraphs, <div class="align-center"> for centred blocks.

const p = (...paragraphs) => paragraphs.join("<br><br>");
const sceneBreak = '<div class="align-center">***</div>';

const geraldsToystore = p(
  "<h3>Windows are Storybooks</h3>",
  "I hunch against the windowsill for hours, crumpled like a stepped-on shortbread biscuit. My cheek presses against the tiled window. From the outside I imagine it looks like the dough we rolled out under a make-shift rolling pin of glass. The harder we pressed, the further the dough bulged across the table. Now, my cheek is well-imprinted against the window; &ldquo;a perfectly-smooth texture,&rdquo; I&rsquo;d imagine your remark.",
  "I sometimes startle from my observations of people when I press too hard. I want to join the passing people&rsquo;s stories and sift through that window like flour through your hands. But my mind does sift! I join every walking story.",
  "Across the street is a toy shop, freshly painted the green of parsley, its curcuma-coloured window sill spelling Gerald&rsquo;s Toystore. I read it over and over again, willing it to unravel itself into a story like unrolling a Chelsea bun. You used to say that there is a secret in the center of each bun. Are people like Chelsea buns?",
  sceneBreak,
  "A woman walks into the toy store.",
  "Her dress is blue satin, dark as rain clouds. Bracelets play tunes on her wrists, humming with the dangling diamond earrings. They dangle like rain drops, moving my gaze to the back of her bare neck as she slips the toystore&rsquo;s door open to dissolve into the unknowns of Gerald&rsquo;s Toystore.",
  "The satin shimmers in the dusty evening sun, catching my eye like a hair in dough. She exits the toy store holding an unpackaged wooden horse. It is painted beautifully &ndash; blue, red, white like the Union Jack. It is the day before Christmas; why leave it unpackaged if you need it packaged by the next morning? From prior observations that day, I know Gerald&rsquo;s Toystore offers all sorts of wrapping paper.",
  "The moment she turns from the toystore&rsquo;s steps to hurry down the cobbled street, I glimpse her left ear, bare as an empty plate. Like a lost sock, only one diamond earring dangles from her pair of ears. A horse carriage rolls by, blocking my sight of her.",
  sceneBreak,
  "The floor creaks. Nanny walks in with a tray of Rock Cakes. &ldquo;Is the window really that comfortable? Come here, have some tea.&rdquo;",
  "I plunge the Rock Cake into tea, waiting for the raisins to float. There is no doubt that the woman is a wealthy upper-class lady; she wouldn&rsquo;t need to sell the earring in the toy store. Further, it is unthinkable for her to have lost such an earring by accident. I imagine that she would have noticed such a missing heaviness immediately. Neither could it have been stolen, for I watched her enter the toystore&rsquo;s safety with two and exit its safety with one.",
  "The crumbs are sinking. The raisins too.",
  "You don&rsquo;t know, but we live in a coastal town with sea trade now. Father is a merchant captain now. And he has so many stories now, so many. Pirates, truths and tales &ndash; you would have loved them. Barrels of ale pass overground while smuggled treasures are dragged through alleyways. Within seconds, the bare-necked woman transforms into a blue-veiled pirate, infiltrating the city with her gang as freshly-baked Rock Cake air, a room. Her pirate gang, operating in town, must have just docked in port, smuggling their heaped hoards into the hopelessly knotted alleyways. Could the diamond earrings be a secret code, the missing one a payment for silence?",
  sceneBreak,
  "The door creaks. Nanny walks in with a heap of laundry in her hands. &ldquo;Your tea is getting cold, darling.&rdquo; I nod faintly and pick up the teacup. The two raisins have sunken to the bottom of the tea cup. Why are the raisins not floating?",
  "Through the toy store window I see a spectacle-wearing man. That must be Gerald, the toy store owner. His brows are thick as honey and when he frowns as he looks outside, they merge into one honeycomb. He turns his back to me as a customer, blurry through the window, comes up to him.",
  "People pass into the toystore like a tray of biscuits into an oven. I pick out the best of them, shining like golden shortbread biscuits and decorate them with my story&rsquo;s icing. Just earlier a mother with a daughter with two braids dropping down her back like drooping antennas entered the toy store. I closed my eyes to feel my bun-sized hand wrap itself around her mother&rsquo;s. I thought of your hands carefully braiding my untameable hair, polishing myself for Christmas dinner, struggling with my hair&rsquo;s dough-with-too-little-flour restlessness. When I opened my eyes, the mother-daughter ensemble had vanished into the toy store, but I could smell the meal they would have together, all huddled around an orange-zest-coloured fire. Father is still unable to tame my hair, you know. &ldquo;Like a lion&rsquo;s mane. Too wild.&rdquo; He always says. I always answer: &ldquo;Father, tell me the story of when you saw a real lion when you sailed to the Cape.&rdquo;",
  sceneBreak,
  "It is Christmas morning and Nanny had decorated the windows with mistletoe vines, braided with flaring red ribbons. My breath freezes against the glass like sugar crystals. My hair remains untamed.",
  "People roll through the street like Rolling Scones on display. I see Gerald flinging open the toystore&rsquo;s door to the street&rsquo;s vastness. I see the pirate woman step out from an alleyway. She is clenching the national-colored wooden horse under her arms. The long rain-cloud-coloured coat effortlessly sweeps the ground, twisting and turning like rolling a Chelsea bun. Her curly hair is braided into a crown and the single diamond earring dances in the lonely light of Christmas morning. The thought of having my lion hair so lovingly done, effortlessly perched on my head like an unstealable crown, makes me shiver. I could be Queen whenever it pleases me. Slowly, my cheek freezes onto the window plane, my gaze sifting the street. I watch Gerald shift up his spectacles and nudge a silent smile as she steps in. The toy store door strikes shut.",
  sceneBreak,
  "The diamond earring reminds me of something. Father, pirates, diamonds, The Diamond? She is The Diamond! The codename for the master of pirate conspiracy, smuggling the most valuable of rubies, jades, emeralds, and diamonds into the harbor town. Father said, &ldquo;She comes from one of the oldest families in the businesses, down to the legendary blackbeard.&rdquo; She would walk into any bar, heads flinging towards her like puppets, her mind playing <em>I am The Diamond</em> on repeat. She would sweep through streets as easily as molten butter on sugar scones. Who would think a woman to hold such authority? I envied her. Her, dressed in blue satin, dark as rain clouds. Her, with bracelets playing tunes on her slinky wrists, humming with the dangling diamond earrings. Her, with the royal crown of hair and pirate tales. Her, The Diamond. Her, like a Chelsea bun amongst Rock cakes. Did she also have untameable hair when she was young?",
  "Would I one day wear such diamonds as if they were nothing but rain drops?",
  "Those diamonds must be hidden in the wooden horse. She would come into the toy store with smuggled gemstones for Gerald and return with an empty wooden horse, repeating until the stash is depleted, like eating away a tray of scones. Then, of course, no wrapping is needed. It is not a present, it is a means of transport. Father had told me of such fabulous ways of smuggling, in sewn-in pockets and stashed in hollow wood, but a wooden toy horse from the famous Gerald&rsquo;s Toystore! Until that day, such a thing I never believed could be true.",
  sceneBreak,
  "Painted in the green of parsley, under the curcuma-coloured shop sill spelling Gerald&rsquo;s Toystore, The Diamond walks out empty-handed. Father strikes the living room door open and I lift my doughy cheek from the frozen window, unfolding from my crumpled-shortbread-pose. &ldquo;Oh, my lion-haired girl. Merry Christmas!&rdquo;",
  "&ldquo;Father!&rdquo; I fall into his arms like the raisins fell to the bottom of the tea.",
  "&ldquo;Remember your stories about The Diamond pirate? I just saw her right there, you wouldn&rsquo;t believe it.&rdquo; I would tell him everything I saw, for he has returned.",
  "You would not believe it either, mum.",
  "<strong>Author&rsquo;s Note:</strong>",
  "This narrative concept of this story intrigued me immensely and I have given it more thought by experimenting with this story. The story is told from the perspective of a narrator that knows no more about the true story behind the people she sees passing in and out of the toy store, than the reader themselves. Yet, the reader is tricked into believing that the narrator&rsquo;s imaginary story is the true one, nearly engulfed in her imagination, even though they will never (and neither, will I) know the actual story of those characters. Windows are storybooks, if only our imaginations permit us to turn them into one. The narrator in this piece has done so &ndash; out of loneliness and excess imagination. She thereby unknowingly created a character that inspires her, believing her to be real. Every person passing by that (or any) window has a story in them &ndash; imagined or real. It is up to us to decide what to do with those walking stories.",
  "For more writing by me and a possible continuation of this story, click here and please feel free to reach out to my telegram @annabelschon for any feedback on this story."
);

// verse helpers: each stanza is its own block; right-aligned stanzas mirror the
// original's layout, left stanzas keep the default alignment
const stanza = (...lines) => lines.join("<br>");
const rightStanza = (...lines) => `<div class="align-right">${lines.join("<br>")}</div>`;
const verse = (...stanzas) => stanzas.join("<br><br>");

const sustainability = verse(
  rightStanza(
    "&ldquo;You know that whales sing to their loved ones?&rdquo;",
    "&ldquo;No, they just make noises because they want to f*ck.&rdquo;",
    "&ldquo;Really? And how is that different from human love serenades?&rdquo;"
  ),
  stanza(
    "Why do we give the privilege of feelings only to the human race?",
    "Why do we think we are the only ones entitled to love?",
    "Is it because we would have to accept",
    "the fact",
    "that we kill sensible beings for the market?",
    "Is it because we would have to accept",
    "the burden",
    "of the consciousness of the villain?"
  ),
  rightStanza(
    "&ldquo;Hmm, yes, but humans were made to eat meat.&rdquo;",
    "&ldquo;Yes, we were, we need it.",
    "It&rsquo;s people&rsquo;s livelihood, it&rsquo;s people&rsquo;s culture,",
    "but we are acting like a dominant vulture.",
    "We&rsquo;re waiting so we can take more.&rdquo;"
  ),
  stanza(
    "Actually no,",
    "vultures wait until an animal dies,",
    "humans kill for leisure,",
    "or maybe for pleasure,",
    "and we schedule our kills.",
    "We are nothing alike.",
    "We wish we could be."
  ),
  rightStanza("So we villainize animals", "that we kill for free."),
  stanza(
    "But wait, veganism is not the road to take,",
    "it doesn&rsquo;t see the obvious.",
    "It doesn&rsquo;t see how the access inequality",
    "defines the availability",
    "of choice in diet.",
    "Some don&rsquo;t choose what they eat,",
    "whether it&rsquo;s tofu or meat."
  ),
  stanza(
    "We cannot choose for others,",
    "as diet is culture",
    "and culture is scarce",
    "in this globalized world;",
    "so let&rsquo;s not steal it",
    "from those who preserve",
    "what they&rsquo;ve been taught",
    "even if it includes",
    "some meat."
  ),
  stanza(
    "Veganism acts as if meat was just a substance,",
    "but it isn&rsquo;t, it&rsquo;s more than that",
    "for many on this planet.",
    "Yet I agree,",
    "the problem is how we consume,",
    "How we live and interact with nature,",
    "Eating meat doesn&rsquo;t have to mean",
    "Torturing stock without a blink",
    "Of an eye.",
    "We can show humanity",
    "In killing",
    "When it&rsquo;s for necessity",
    "and not profit."
  ),
  stanza(
    "Still, praising vegans as saviors,",
    "is one of many flaws of the West,",
    "the rhetorics are almost religious,",
    "dismissing the rest,",
    "That has never been a solution",
    "to any problem,",
    "it only creates a division",
    "among us:",
    "humans."
  ),
  stanza(
    "I wish I would know,",
    "what would be the solution,",
    "rather than criticizing the present",
    "but I don&rsquo;t.",
    "It seems to be a cycle."
  ),
  stanza(
    "I just know that",
    "systemic changes happen slowly,",
    "and time is a currency",
    "we don&rsquo;t own much of",
    "and that has no exchange rate for money."
  ),
  stanza("So I guess we are just broke(n).")
);

export const MANUAL_ENTRIES = {
  2: [
    {
      // the old site's own link 404s, so this was supplied by the editors
      after_slug: "dirty-art-by-tawongaishe-julia-m25",
      piece: {
        slug: "gerald-s-toystore-windows-are-storybooks-by-annabel-schon",
        title: "Gerald’s Toystore",
        author_name: "Annabel Schön",
        class_year: "M25",
        category: "Fiction",
        body_html: geraldsToystore,
        images: [],
      },
    },
  ],
  3: [
    {
      // old site's page 404s; supplied by the editors. Right-aligned stanzas
      // mirror the printed layout. `verse` keeps authored line breaks honest.
      after_slug: "farewell-summer-by-katie-kuehr-m27",
      piece: {
        slug: "sustainability-by-hana-paskova-m25",
        title: "Sustainability",
        author_name: "Hana Paskova",
        class_year: "M25",
        category: "Nonfiction",
        body_html: sustainability,
        verse: true,
        images: [],
      },
    },
  ],
};
