// =============================================================================
// CHIMERA'S AUDIO GUIDE — one page, at /Events/chimera/audio-guide.
// =============================================================================
//
// Four recordings, each with the words written out underneath it. Linked from
// the Audio Guide block in the Chimera part of /Events.
//
// On the old Cargo site this was five separate pages: an index of the four
// clips, plus a page per transcript. They are one page here. The recordings
// themselves are unchanged — the same four files, copied across.
//
// -----------------------------------------------------------------------------
// THE TRANSCRIPTS
// -----------------------------------------------------------------------------
// `transcript` is a list of lines, and the line breaks are the ones from the
// original transcripts. They are not paragraphs — they follow the pauses in
// the recording — so keep them as they are unless you are listening along.
//
// Every recording must have a transcript. Somebody who cannot hear the audio
// reads this instead, so an empty one makes the page unusable for them.
//
// =============================================================================

import type { EVENT_FILES } from "./event-images";

export type AudioTrack = {
  /** which recording, from the generated list in event-images.ts */
  file: keyof typeof EVENT_FILES;
  title: string;
  transcript: string[];
};

export const AUDIO_GUIDE = {
  eyebrow: "Audio Guide",
  title: "Chimera",
  standfirst:
    "As you go through the exhibition, listen to these audio guides — who is Chimera?",
  creditsHeading: "Credits",
  credits: [
    { role: "Script", names: "Polina Zen" },
    { role: "Voice", names: "Htet Yuya" },
    { role: "Transcription", names: "Mika-Erik Möser" },
    { role: "Audio Production", names: "Shawn Lee" },
  ],
};

export const TRACKS: AudioTrack[] = [
  {
    file: "audio-guide/room-1",
    title: "Room 1 // Entrance",
    transcript: [
      "Welcome! Take a moment to ground yourself in this space.",
      "Feel your presence here in this exhibition. I'm glad you've arrived, and it's wonderful to meet you.",
      "Who am I? I'm Chimera. Wait, do you mean who am I?",
      "There are multiple answers I could give you, but let's start with this.",
      "I'm your presence. I'm the stories you tell and all of the stories you've ever heard.",
      "I'm the moment in which you step foot onto the floor of this gallery.",
      "But I'm also the absence. I'm the stories you'll never hear.",
      "I'm the moment of defining audience, language, and rules of interaction.",
      "I'm exclusion. I'm an ever-changing entity that transcends national and cultural boundaries.",
      "A third space, if you will.",
      "I travel and throw down my roots in many places, at least in those where my presence is allowed.",
      "Yet, my existence needs no permission.",
      "I'm you in this chair.",
      "An undebatable presence in the exhibition space. I'm the exhibit itself.",
      "Now, take this pen and begin your exploration of presence and absence.",
      "As you start this journey, know that you are seeing a portion of me that is equivalent to, hmm, maybe an eyelash.",
      "The rest of me? You'll need to actively seek it.",
      "And perhaps you never will.",
      "I am the light and the shadow, the body and the mind, the boundary and its absence.",
      "Come meet me.",
    ],
  },
  {
    file: "audio-guide/room-2",
    title: "Room 2 // Box Box Box",
    transcript: [
      "I know that you, dear visitor, are probably curious about what I look like.",
      "You might find it easier to understand me once you meet my physical body.",
      "But here's the thing. Once you see it, you will categorize me.",
      "And sometimes, I don't want to be put in a box.",
      "What if instead, I invite you to explore my personal diary?",
      "A collection of moments from my journey.",
      "Dirt under my nails from gardening, red eyes from long nights filling out visa documents the warmth of childhood memories sitting in my chest, the taste of sounds on my tongue that my friends cannot quite pronounce.",
      "I said I don't want to be put in a box.",
      "But I too, dear visitor, fragment myself sometimes.",
      "I'm not easy to grasp.",
      "Sometimes, I try to understand myself by separating my journey into pieces.",
      "I meditate on how aspects of my journey manifest as sensations in my body.",
      "But in reality, these boxes are not rigid.",
      "My experiences overlap, forming an entity of feelings that I cannot really put into words.",
      "How come the whole becomes more than the sum of its parts?",
      "As you walk around and interact with the artifacts in my memory boxes, take a moment to notice how they make you feel.",
      "Then, imagine putting on new lens.",
      "A lens that lets you deconstruct what you've experienced.",
      "Step back and observe the installation from a distance, seeing it as a whole.",
      "Pay attention to the sensations in your body once more.",
      "I may not reveal my physical form to you, but I am here, in all of the sensations you feel.",
      "I am your experience of this space.",
    ],
  },
  {
    file: "audio-guide/workshop-1-bodymapping",
    title: "Workshop 1 // Bodymapping",
    transcript: [
      "Ugh. Walking long distances makes my body so worn out. Blisters on my feet, pupils wide from curiosity, shoulders slouch from wearing a heavy school backpack.",
      "Everyone's migration imprints on their body differently.",
      "Yet they transcend the boundaries of the individual body and flow from one generation to another.",
      "My grandparents too walked long miles. This changed their body, and these experiences impact what's passed down to me.",
      "When I envision future generations, I'm thinking of how I am breaking and repeating generational curses. My body experiences, both pain and joy will affect those who come after me, and yours will too.",
      "I invite you to compare and contrast",
      "the migration experiences between the past, present, and future by mapping them onto your body, your ancestors' bodies, and those yet to be born.",
      "As you are watching the video prompt and engaging in the practice of body mapping, do not limit yourself to your family. You can scale up to the level of the community as well as overlap your body maps with those of the other visitors of the exhibition.",
      "What is similar, what is different, what continues and where does something break?",
    ],
  },
  {
    file: "audio-guide/workshop-2-writing",
    title: "Workshop 2 // Writing",
    transcript: [
      "When the shape of my body slips away, people try to define me and capture my presence in the language of institutions.",
      "They think they know me because they can name me, but I am not what they call me.",
      "When I speak, I gather words from forms and reports, the scraps of paper that try to pin me down.",
      "I piece them together, letting them spill into poetry and contradiction.",
      "These words betray their origins.",
      "They become mine.",
      "I ask you, what words have tried to define you?",
      "Which ones have felt like cages and which ones have opened doors?",
      "Cut them out, piece them together, and make them yours, a poem, a whisper, a memory.",
      "Build yourself a body of language that can't be controlled, that resists being formalized.",
      "I will stay with you throughout this activity and as you exit the exhibition space, following you through your lifelong journey of constructing and deconstructing yourself.",
    ],
  },
];
