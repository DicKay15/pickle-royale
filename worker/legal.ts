/**
 * Public legal / support pages, served straight from the Worker.
 *
 * Both app stores require a reachable privacy-policy URL at submission time,
 * and Apple also checks that the support URL resolves. Generated from
 * pickle-royale-store/marketing/privacy-policy.md — edit that file and
 * regenerate rather than hand-editing the HTML here.
 */

const STYLE = `
  :root {
    --cream: #fbf6ea; --ink: #142a1f; --ink-soft: #3c5247;
    --court: #14604a; --court-deep: #0c3b2d; --coral: #ff6b4a;
    --cream-dim: #f3ecda;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; background: var(--cream); color: var(--ink);
    font: 16px/1.65 "Bricolage Grotesque", system-ui, -apple-system, sans-serif;
    padding: 32px 20px 80px;
  }
  .wrap { max-width: 680px; margin: 0 auto; }
  .top { display: flex; align-items: center; gap: 12px; margin-bottom: 28px; }
  .top img { width: 46px; height: 46px; }
  .top b {
    font-family: "Lilita One", system-ui, sans-serif; font-size: 21px;
    letter-spacing: .5px; text-transform: uppercase; color: var(--court-deep);
  }
  .top b em { font-style: normal; color: var(--coral); }
  h1, h2, h3 {
    font-family: "Lilita One", system-ui, sans-serif;
    color: var(--court-deep); letter-spacing: .4px; line-height: 1.15;
  }
  h1 { font-size: 30px; margin: 0 0 18px; text-transform: uppercase; }
  h2 { font-size: 21px; margin: 34px 0 10px; }
  h3 { font-size: 16px; margin: 22px 0 8px; text-transform: uppercase; letter-spacing: .06em; }
  p, li { color: var(--ink-soft); }
  a { color: var(--court); }
  ul { padding-left: 20px; }
  li { margin-bottom: 6px; }
  code {
    background: var(--cream-dim); padding: 1px 5px; border-radius: 5px;
    font: 13px/1 "Azeret Mono", ui-monospace, monospace; color: var(--court-deep);
  }
  hr { border: none; border-top: 2px dashed rgba(20,42,31,.18); margin: 30px 0; }
  .tw { overflow-x: auto; margin: 14px 0; }
  table { border-collapse: collapse; width: 100%; min-width: 480px; font-size: 14px; }
  th, td { border: 1px solid rgba(20,42,31,.18); padding: 8px 10px; text-align: left; vertical-align: top; }
  th { background: var(--cream-dim); color: var(--court-deep); font-weight: 700; }
  td { color: var(--ink-soft); }
  .back { display: inline-block; margin-top: 34px; font-weight: 700; color: var(--court); }
  @media (prefers-color-scheme: dark) {
    :root { --cream: #10201a; --cream-dim: #172c24; --ink: #eef5ef; --ink-soft: #b9cdc2; --court-deep: #b7f05e; --court: #9fe04a; }
    th { color: var(--court-deep); }
  }
`;

function page(title: string, body: string): Response {
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title} — Pickle Royale</title>
<link rel="icon" href="/favicon.svg"/>
<style>${STYLE}</style></head>
<body><div class="wrap">
<div class="top"><img src="/favicon.svg" alt=""/><b>Pickle <em>Royale</em></b></div>
${body}
<a class="back" href="/">← Back to the app</a>
</div></body></html>`,
    { headers: { "content-type": "text/html; charset=utf-8" } },
  );
}

export function privacyPage(): Response {
  return page("Privacy", PRIVACY_BODY);
}

export function supportPage(): Response {
  return page(
    "Support",
    `<h1>Support</h1>
<p>Pickle Royale is a one-person project. If something is broken, unclear, or
you want your data removed, email me and I will actually read it.</p>
<h2>Contact</h2>
<p><strong><a href="mailto:dhrumil.kherde@gmail.com">dhrumil.kherde@gmail.com</a></strong></p>
<p>Put &ldquo;Pickle Royale&rdquo; in the subject line. Expect a reply within a
few days; data requests are handled within 30 days and usually much sooner.</p>
<h2>Common questions</h2>
<h3>How do I join a group?</h3>
<p>Ask whoever set it up for the six-character join code, then enter it from the
group switcher at the top of the app. A group admin can also send you an invite
link that claims your player for you.</p>
<h3>Why is my rating provisional?</h3>
<p>Your first ten matches move your rating faster so it settles near your real
level quickly. After that it steadies down.</p>
<h3>Someone typed the wrong score</h3>
<p>A group admin can fix or delete any match from the Rumbles tab. Ratings are
recalculated from the whole match log, so correcting an old score automatically
repairs every rating after it.</p>
<h3>Delete my account</h3>
<p>Email the address above from the account&rsquo;s own email address and say what
you want removed. See the <a href="/privacy">privacy policy</a> for what is stored.</p>`,
  );
}

const PRIVACY_BODY = `<h1>Privacy policy: Pickle Royale</h1>
<p><strong>Last updated: August 15, 2026</strong></p>
<p>This policy describes what Pickle Royale collects, why, and what happens to it. It&#x27;s written to match what the app actually does, checked against its source code, not a generic template.</p>
<p>Questions or a request about your data: <strong>dhrumil.kherde@gmail.com</strong></p>
<hr/>
<h2>Who this is</h2>
<p>Pickle Royale is built and operated by Dhrumil Kherde, an individual developer, not a company. There&#x27;s no team, no support ticketing system beyond the email above, and no data broker relationship of any kind.</p>
<hr/>
<h2>What we collect</h2>
<h3>When you sign in with Google</h3>
<p>Pickle Royale requires a Google account to use. When you sign in, Google shares three things with the app, and only these three:</p>
<ul><li>Your <strong>name</strong></li><li>Your <strong>email address</strong></li><li>Your <strong>profile photo URL</strong> (a link to your existing Google avatar, not a copied image file)</li></ul>
<p>We never see or store your Google password. Sign-in happens entirely through Google&#x27;s own OAuth flow; Pickle Royale only receives the identity information above once you&#x27;ve approved it on Google&#x27;s screen.</p>
<h3>What you (or your group&#x27;s admin) enter into the app</h3>
<ul><li><strong>Group data:</strong> group names and 6-character join codes.</li><li><strong>Player data:</strong> display names and an emoji avatar for each player in a group. Players don&#x27;t need their own account; the group admin can add &quot;Casual&quot; players who never sign in themselves.</li><li><strong>Match data:</strong> which two players were on each team, the score, the &quot;who carried?&quot; contribution split, and the timestamp.</li><li><strong>Ratings:</strong> each player&#x27;s Royale Rating, recalculated from the match log.</li></ul>
<p>None of this is collected through tracking or inference. It&#x27;s the data you type into the app to use its one function: keeping score.</p>
<h3>What we don&#x27;t collect</h3>
<ul><li>No location data, ever.</li><li>No contacts, camera roll, or microphone access.</li><li>No advertising identifiers.</li><li>No third-party analytics or crash-reporting SDK is integrated into the app.</li><li>No payment information (the app is free, with no purchases).</li></ul>
<hr/>
<h2>Why we collect it (and the legal basis)</h2>
<div class="tw"><table><thead><tr><th>Data</th><th>Purpose</th><th>Legal basis (GDPR-style framing)</th></tr></thead><tbody><tr><td>Name, email, avatar</td><td>Create and identify your account, let you sign back in, show your identity to your own group</td><td>Necessary to perform the service you asked for (Art. 6(1)(b), contract/performance)</td></tr><tr><td>Group and player data</td><td>The core feature: a shared, private leaderboard for your group</td><td>Necessary to perform the service</td></tr><tr><td>Match and rating data</td><td>Compute the Royale Rating and leaderboard</td><td>Necessary to perform the service</td></tr><tr><td>Session cookie</td><td>Keep you signed in between visits</td><td>Necessary to perform the service</td></tr></tbody></table></div>
<p>There&#x27;s no separate marketing use, no profiling, and no automated decision-making that affects you beyond calculating a pickleball rating.</p>
<hr/>
<h2>How your session works</h2>
<p>When you sign in, Pickle Royale sets a single cookie (<code>pr_session</code>) containing a cryptographically signed token, not your raw data. The cookie is:</p>
<ul><li><strong>HTTP-only</strong> (not readable by page scripts)</li><li><strong>Secure</strong> (only sent over HTTPS)</li><li>Valid for <strong>30 days</strong>, after which you&#x27;ll need to sign in again</li></ul>
<p>Signing out clears this cookie immediately.</p>
<hr/>
<h2>Who else sees your data</h2>
<p>Pickle Royale shares data with exactly two categories of third party, both infrastructure providers, neither of which uses your data for their own purposes:</p>
<ul><li><strong>Google Sign-In:</strong> handles authentication. Google&#x27;s own privacy policy governs what Google does with the sign-in event on their end; Pickle Royale never receives your Google password and only requests basic profile info (name, email, avatar).</li><li><strong>Cloudflare:</strong> hosts the app, the database (Cloudflare D1), and weekly backups (Cloudflare R2). Cloudflare processes data as our infrastructure provider; it does not use your data for its own purposes.</li></ul>
<p><strong>We do not sell data. We do not share data with advertisers or data brokers. We do not run ads in the app.</strong></p>
<p>Within a group, other members can see the names, scores, and stats of matches in that group, since that&#x27;s the entire point of a shared leaderboard. Group data is never visible to people outside the group; membership is enforced server-side on every request.</p>
<hr/>
<h2>How long we keep data</h2>
<ul><li><strong>Regular accounts and groups:</strong> kept indefinitely, for as long as the account exists, so your match history and rating stay intact across seasons. You can request deletion at any time (see below).</li><li><strong>Demo accounts:</strong> if you try the app via the no-login demo mode, a throwaway account and a sample group are created just for that visit. These are automatically and permanently deleted <strong>24 hours later</strong> by an automated daily cleanup. Nothing you do in demo mode persists past that window, and demo cleanup never touches real accounts or real groups.</li><li><strong>Backups:</strong> the production database is backed up weekly to encrypted cloud storage (Cloudflare R2), for disaster recovery only. Backups are retained on a rolling basis and are not used for any purpose other than restoring the app if something breaks.</li></ul>
<hr/>
<h2>Your rights</h2>
<p>Regardless of where you live, you can ask us to:</p>
<ul><li><strong>Access</strong> a copy of the data tied to your account.</li><li><strong>Correct</strong> inaccurate data (most of this you can already edit yourself in the app: your player name, avatar, and match entries if you&#x27;re a group admin).</li><li><strong>Delete</strong> your account and all data tied to it, including your player records and match history in every group you belong to.</li><li><strong>Export</strong> your data in a portable format.</li></ul>
<p>If you&#x27;re in the EU/UK, these map to your rights under GDPR. If you&#x27;re in California, these map to your rights under the CCPA/CPRA. We apply the same process to everyone regardless of location, rather than offering a reduced version outside those jurisdictions.</p>
<h3>How to request deletion or access</h3>
<p>Email <strong>dhrumil.kherde@gmail.com</strong> from the email address associated with your account, with &quot;Pickle Royale&quot; and what you&#x27;re requesting in the subject line. Requests are handled by hand (this is a one-person project) and completed within 30 days, typically much sooner.</p>
<p>Deleting your account removes your user record and unlinks you from any player you&#x27;d claimed. If you&#x27;re a group admin, deleting your account does not delete the group or erase your former teammates&#x27; match history; ownership of the group transfers or the group is archived, whichever you request.</p>
<hr/>
<h2>Children&#x27;s privacy</h2>
<p>Pickle Royale is not directed at children and is not knowingly used by anyone under 13. Google Sign-In itself requires users to meet Google&#x27;s own minimum age requirements, which already acts as a first gate. If we learn that a child under 13 has provided personal data, we will delete it. If you believe a child has used the app, contact dhrumil.kherde@gmail.com and we&#x27;ll remove the associated data.</p>
<hr/>
<h2>Changes to this policy</h2>
<p>If what the app collects or how it&#x27;s used changes materially, this page will be updated and the &quot;Last updated&quot; date at the top will change. Continued use of the app after an update means you accept the revised policy.</p>
<hr/>
<h2>Contact</h2>
<p>Dhrumil Kherde <strong>dhrumil.kherde@gmail.com</strong></p>`;
