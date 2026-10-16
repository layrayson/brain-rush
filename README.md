# Brain Rush

Logic training for maths, built for an SS1 student who can do the sums but finds the reasoning hard: turning word problems into steps, spotting patterns, and checking an answer instead of guessing.

**Play it:** https://layrayson.github.io/brain-rush/

## Games

| Skill | Game | What it trains |
|---|---|---|
| Word problems | Bar Builder | Pick the bar model that matches a story (part-whole, compare, change, "twice as many"), then solve it |
| Word problems | Step by Step | Plan the first step of a multi-step problem, then finish it (naira change, buses, sharing, fencing, ages) |
| Patterns | Next in Line | Name the rule that fits every jump, then continue the sequence |
| Patterns | Undo Machine | Work backwards through a number machine, last step first |
| Deduction | Number Detective | Use clues to cross out numbers until one is left |
| Deduction | Fruit Algebra | Emoji equations: find each fruit's value, with BODMAS and simultaneous-equation style elimination at higher levels |
| Deduction | Fruit Scales | Combine scale clues to find the heaviest fruit |
| Checking | Spot the Slip | Find the first wrong line in a classmate's working (BODMAS, equations, money), then give the right answer |
| Checking | Sense Check | Estimate whether someone's answer makes sense, then pick the right one |

## How it teaches

- **No timer.** Time pressure pushes students towards guessing, so every game is a set of 5 or 6 puzzles to think through.
- **Reason first, answer second.** Most puzzles ask for the plan before the number: the bar model, the rule, the first step, the line with the mistake.
- **Mistake-specific hints.** A first wrong answer gets a hint aimed at that mistake, for example "+3 works for the first jump, but check the others". A second wrong answer shows a worked explanation that finishes with a check.
- **Scoring rewards thinking.** Full points for a first-try answer, half with a hint, none for guessing through. Difficulty rises after correct answers and eases off after mistakes.
- **Bar models** (schema-based instruction) are used for word problems because they have the best evidence base for students who struggle with them.

## Rewards

- **Tickets 🎟️** are earned by reasoning: 2 for a first-try answer, 1 for an answer after a hint, nothing for guessing through, and a 5-ticket bonus for finishing a workout. New players start with 10.
- **Arcade:** each break game costs 10 tickets, so a workout buys roughly three or four games and the puzzles stay the main event.
  - **Whot! vs Brain:** the Nigerian card game (Hold on, Pick two, Suspension, General market, WHOT) against the mascot.
  - **Fruit Slice:** swipe the fruit, avoid the bombs, three lives.
  - **Flappy Brain:** tap to fly the mascot through the pipes.
  - **Colour Sort:** pour coloured balls until every tube is one colour. Levels get harder and are always solvable.
- **Sticker album:** 24 stickers (common, rare, legendary) won by finishing a workout, getting 3 stars in a game, or ranking up.

## Modes and progress

- **Today's workout:** one game from each skill, about 15 minutes, ending with a logic score, per-skill bars and a coach tip.
- **Practise one game:** continue from your saved level, or restart at level 1.
- Progress is saved per player in the browser: levels, XP and ranks, best scores, and a chart of workout scores. Log out to switch players. Reset clears or deletes a player. Nothing leaves the device.

## Playing on more than one device

Players are made with a name and a 4-digit PIN and saved online, so progress carries across phones and laptops. On a new device, choose **I already have a player** and enter the same name and PIN. Progress saves automatically a moment after each change. When the device is offline it keeps working and catches up once it reconnects. Players made before online saves existed show a **Save online** link on the home screen.

The save server is `api/player.js`, a Vercel function (project `brain-rush` on the layraysons-projects team, https://brain-rush-ochre.vercel.app) backed by a private Vercel Blob store:

- One JSON file per player, keyed by a SHA-256 of the lower-cased name.
- PINs are stored as salted scrypt hashes. After login the client keeps an HMAC token (secret `TOKEN_SECRET`) so it can save without asking for the PIN again.
- Five wrong PINs lock a player for 15 minutes.
- CORS allows `https://layrayson.github.io` and `http://localhost:4175` only.

Deploy API changes with `vercel deploy --prod` from this folder.

## Running it

The game is a single `index.html` with no build step. Open it in a browser, or serve the folder with any static server. Online saves only work from the allowed origins above.
