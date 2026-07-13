import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Averia_Serif_Libre, Inter } from "next/font/google";
import styles from "./submit.module.css";

const averia = Averia_Serif_Libre({
  variable: "--font-averia",
  subsets: ["latin"],
  weight: "400",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Submit to the Magazine — Napkins",
};

export default function SubmitPage() {
  return (
    <div className={`${styles.page} ${averia.variable} ${inter.variable}`}>
      <div className={styles.topBar}>
        <Link href="/" className={styles.logo}>
          <Image
            src="/assets/napkins-logo-square.png"
            alt="Napkins logo"
            width={182}
            height={240}
            style={{ width: 56, height: "auto" }}
          />
        </Link>
        <nav className={styles.nav}>
          <Link href="/#about" className={styles.navLink}>
            ABOUT US
          </Link>
          <Link href="/#magazine" className={styles.navLink}>
            MAGAZINE
          </Link>
          <Link href="/#events" className={styles.navLink}>
            EVENTS
          </Link>
          <a href="mailto:napkinsmag@gmail.com" className={styles.navLink}>
            CONTACT
          </a>
        </nav>
      </div>

      <main className={styles.content}>
        <div className={styles.eyebrow}>Actions</div>
        <h1 className={styles.title}>Submit to the Magazine</h1>
        <p className={styles.muted}>
          We&rsquo;re happy that you are interested in submitting to the Magazine! Here are
          some guidelines to help you get started.
        </p>

        <Image
          src="/assets/submit-photo.avif"
          alt="Napkins zines spread out on a table"
          width={2304}
          height={1728}
          priority
          className={styles.photo}
        />

        <p className={styles.question}>Why should I publish with Napkins?</p>
        <p className={styles.muted}>
          When you publish with Napkins Magazine, you&rsquo;re not just submitting your work;
          you&rsquo;re joining a community that&rsquo;s got your back. Our editorial team knows
          firsthand how lonely the creative process can feel. That&rsquo;s why we&rsquo;re here
          to offer you all the support you need, right from the start. You&rsquo;ll have access
          to a space that nurtures your creativity and connects you with fellow creators.
        </p>

        <p className={styles.sectionHead}>ELIGIBILITY TO BE A CONTRIBUTOR</p>
        <p className={styles.muted}>
          Napkins accepts submissions from anyone who is associated with Minerva, which
          includes, but is not limited to:
        </p>
        <ul className={styles.list}>
          <li>current students</li>
          <li>alumni</li>
          <li>faculty members</li>
          <li>staff</li>
        </ul>

        <p className={styles.sectionHead}>CATEGORIES</p>

        <p className={styles.categoryName}>Poetry</p>
        <p className={styles.detail}>Submission limit: up to 3 poems</p>
        <p className={styles.detail}>
          Line limit: as you reasonably deem fit (just maybe don&rsquo;t pull a John Milton in
          Paradise Lost!).
        </p>

        <p className={styles.categoryName}>Flash Fiction</p>
        <p className={styles.detail}>Submission limit: up to 3 pieces</p>
        <p className={styles.detail}>Word limit: &lt;1000 words.</p>
        <p className={styles.detail}>
          If you include images in your work, please upload the .jpg or .png files in a Google
          Drive Folder, and set the sharing permissions to &ldquo;Minerva University&rdquo; and
          &ldquo;Editor.&rdquo;
        </p>

        <p className={styles.categoryName}>Short Fiction</p>
        <p className={styles.detail}>Submission limit: 1 piece.</p>
        <p className={styles.detail}>Word limit: &lt;4000 words</p>
        <p className={styles.detail}>
          If you include images in your work, please upload the .jpg or .png files in a Google
          Drive Folder, and set the sharing permissions to &ldquo;Minerva University&rdquo; and
          &ldquo;Editor.&rdquo;
        </p>

        <p className={styles.categoryName}>Nonfiction</p>
        <p className={styles.subName}>Essays</p>
        <p className={styles.detail}>Submission limit: 1 piece</p>
        <p className={styles.detail}>Word limit: &lt;4,000 words</p>
        <p className={styles.subName}>Reviews</p>
        <p className={styles.detail}>Submission limit: up to 2 pieces</p>
        <p className={styles.detail}>Word limit: &lt;1,500 words</p>
        <p className={styles.subName}>
          Other non-fiction pieces (e.g., journal entries, creative non-fiction recounting
          interesting activities, reflections, etc)
        </p>
        <p className={styles.detail}>
          Submission limit: up to 2 pieces (if under 1500 words); 1 piece only (for those over
          1500 and under 4000 words)
        </p>
        <p className={styles.detail}>Word limit: &lt;4,000 words</p>
        <p className={styles.detail}>
          If you include images in your work, please upload the .jpg or .png files in a Google
          Drive Folder, and set the sharing permissions to &ldquo;Minerva University&rdquo; and
          &ldquo;Editor.&rdquo;
        </p>

        <p className={styles.categoryName}>Art</p>
        <p className={styles.detail}>Submission limit: up to 5 pieces.</p>
        <p className={styles.detail}>E.g., music lyrics, collages, paintings, sketches</p>
        <p className={styles.detail}>
          Please upload the .jpg or .png files of your work in a Google Drive Folder, and set
          the sharing permissions to &ldquo;Minerva University&rdquo; and &ldquo;Editor.&rdquo;
        </p>
        <p className={styles.subName}>Special Assignment</p>
        <p className={styles.detail}>
          Artists can work with writers to create accompanying illustrations. You can indicate
          this in the submission form, and you will be paired with writers!
        </p>
        <p className={styles.subName}>Video &amp; Animation</p>
        <p className={styles.detail}>
          Submission limit: from 2 minutes for animation; from 4 for film
        </p>
        <p className={styles.detail}>
          Please upload the .mov file of your work in a Google Drive Folder, and set the
          sharing permissions to &ldquo;Minerva University&rdquo; and &ldquo;Editor.&rdquo;
        </p>

        <p className={styles.categoryName}>Photography</p>
        <p className={styles.detail}>
          Submission limit: 15 photos, negotiable depending on the context.
        </p>
        <p className={styles.detail}>
          Photographers are required to write accompanying captions or text for the submitted
          photos.
        </p>
        <p className={styles.detail}>
          Please upload the .jpg or .png files of your work in a Google Drive Folder, and set
          the sharing permissions to &ldquo;Minerva University&rdquo; and &ldquo;Editor.&rdquo;
        </p>

        <p className={styles.categoryName}>Translation</p>
        <p className={styles.detail}>
          The guidelines for translated pieces are the same as those from other genres.
        </p>
        <p className={styles.detail}>
          Translators must obtain permission from the original author in order to submit the
          translated work.
        </p>

        <p className={styles.sectionHead}>STEPS IN THE PUBLISHING PROCESS</p>
        <p className={styles.muted}>
          1. Sign up to submit your first draft or concrete ideas you would like to work on.
          You do not need a complete draft&mdash;just make sure you have ideas to work with.
        </p>
        <p className={styles.muted}>
          2. Communicate with your editor. You will be assigned an editor after the deadline
          for signup has passed. Discuss with your editor what you intend to work on, the
          approximate timeline, and the kind of assistance you need.
        </p>
        <p className={styles.muted}>
          3. Work on your drafts. It is rare for everyone&rsquo;s first draft to be the perfect
          end product. Make sure you allocate enough time to anticipate at least 2 refinements
          after submitting your first draft!
        </p>
        <p className={styles.muted}>
          4. Submit the final product to your editor. There is a set final deadline for all
          submissions, which will typically be one month before publishing date. We leave one
          month so the Editor-in-Chief and Graphic Designers have enough time to design and
          curate everything into a neat bomb magazine.
        </p>
        <p className={styles.muted}>
          5. Annotate your pieces throughout your process. We have a Genius-inspired page on
          our website where we show readers the authors&rsquo; annotations of their works.
        </p>

        <p className={styles.sectionHead}>IMPORTANT DEADLINES</p>
        <p className={styles.muted}>
          We recognize that Fall and Spring tend to be busy for Minervans. To ensure all
          contributors have sufficient time to flesh out and refine their works with the
          Editorial Team&rsquo;s assistance, we have two separate deadlines: first and final
          drafts.
        </p>
        <p className={styles.season}>Winter 2026</p>
        <p className={styles.detail}>Sign-up: 10th of September</p>
        <p className={styles.detail}>First draft submission: 1st of October</p>
        <p className={styles.detail}>Final draft submission: 30th of October</p>
        <p className={styles.detail}>Release date: Late December/Early January</p>

        <p className={styles.sectionHead}>FAQs</p>

        <p className={styles.question}>Is it guaranteed that my works will be published?</p>
        <p className={styles.muted}>
          We cannot guarantee that all submissions will be published in the digital magazine.
          Your works may be excluded from the issue if they
        </p>
        <ul className={styles.list}>
          <li>do not meet the theme;</li>
          <li>require heavy editing that cannot be done in time for publishing;</li>
          <li>do not match the quality of other accepted submissions;</li>
          <li>are submitted after the deadline</li>
        </ul>

        <p className={styles.question}>How polished should my first draft be?</p>
        <p className={styles.muted}>
          We do not expect a perfect first draft&mdash;it&rsquo;s typically rare to have a
          flawless first draft!! However, we do wish to see a thoughtful first draft, that is,
          a first draft that clearly tells us the editors the direction you&rsquo;re taking.
        </p>

        <p className={styles.question}>Can I just submit a final draft?</p>
        <p className={styles.muted}>
          No :( From our experience, it is rare for an unedited draft to be polished enough for
          publication. Most of the rejected submissions are those drafts that are submitted for
          the first time on the submission deadline. Therefore, we highly encourage that you
          start early with a first draft and refine based on the suggestions you and your
          editor agree upon.
        </p>

        <p className={styles.question}>
          Can I submit works that have been published elsewhere?
        </p>
        <p className={styles.muted}>
          No, we don&rsquo;t accept works that have been published anywhere, including on
          personal websites.
        </p>

        <p className={styles.question}>
          Can I take down my works once they have been published?
        </p>
        <p className={styles.muted}>
          Depends, but very often no. Any requests for the taking down of a work will be
          discussed by the Editorial Team. Unless the published work touches on personal and
          sensitive issues, we generally reject any requests of this sort.
        </p>

        <p className={styles.question}>Can I submit works to more than one category?</p>
        <p className={styles.muted}>
          Yes, you can. Make sure you adhere to the submission limit in each category.
        </p>

        <p className={styles.question}>Can I exceed the word count limit?</p>
        <p className={styles.muted}>
          We highly encourage you to stick to it. However, you can exceed the limit if you have
          a strong justification. As always, when in doubt, speak with an editor!
        </p>

        <p className={styles.question}>Who will edit my works?</p>
        <p className={styles.muted}>
          Every submission will go through 2 editors before a final review by the
          Editor-in-Chief.
        </p>

        <p className={styles.question}>
          Where do editors play a role in the editing process? Will editing affect the
          creator&rsquo;s intention?
        </p>
        <p className={styles.muted}>
          Editors never edit your works directly. We will always provide you with feedback and
          have you edit your own works before submitting the final drafts. In cases where the
          we do edit your works, you will get a final say in the edits.
        </p>

        <p className={styles.question}>Who can I contact if I want additional support?</p>
        <p className={styles.muted}>
          You can reach out to the Editorettes-in-Chief. Each of them has their specific
          expertise.
        </p>
        <p className={styles.contact}>
          Divya Tarak-Balaji (M28): written mediums (
          <a href="mailto:divya.tarak@uni.minerva.edu">divya.tarak@uni.minerva.edu</a>)
        </p>
        <p className={styles.contact}>
          Yuxi Hou (M29): art and photography (
          <a href="mailto:yuxi@uni.minerva.edu">yuxi@uni.minerva.edu</a>)
        </p>
        <p className={styles.contact}>
          Nokutenda Chimbetete (M28): written mediums (
          <a href="mailto:nokchi1@uni.minerva.edu">nokchi1@uni.minerva.edu</a>)
        </p>
      </main>

      <div className={styles.instaRow}>
        <a href="https://www.instagram.com/napkinseverywhere" aria-label="Napkins on Instagram">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" stroke="currentColor" strokeWidth="2" />
            <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="2" />
            <circle cx="17.6" cy="6.4" r="1.4" fill="currentColor" />
          </svg>
        </a>
      </div>
    </div>
  );
}
