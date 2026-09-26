// Exact-date historical cards. The recovered year-only archive must not feed
// new puzzles until its dates and source links have been reviewed.
const event = (date, title, hint, name, url) => ({
  id: `legacy-${date}`, date, year: Number(date.slice(0,4)), title, hint,
  sources: [{name,url}], dateBasis: "editorial-review",
});
export const VERIFIED_LEGACY_EVENTS = [
  event("2016-11-18", "Pays $25M to settle Trump University fraud",
    "The university's final lesson came with a settlement.", "Time / Associated Press",
    "https://time.com/4576543/donald-trump-university-lawsuit-settlement/"),
  event("2017-05-31", "Tweets 'covfefe' at midnight, never explains it",
    "A midnight typo. A national guessing game.", "The American Presidency Project",
    "https://www.presidency.ucsb.edu/documents/tweets-may-31-2017"),
  event("2018-01-02", "Tweets his nuclear button is bigger than Kim's",
    "Nuclear diplomacy becomes a size contest.", "The Washington Post",
    "https://www.washingtonpost.com/news/post-politics/wp/2018/01/02/trump-to-north-korean-leader-kim-my-nuclear-button-is-much-bigger-more-powerful/"),
  event("2019-09-04", "Doctored hurricane map with a Sharpie",
    "Alabama wasn't in the forecast. The marker disagreed.", "The Guardian",
    "https://www.theguardian.com/world/2019/sep/04/trump-hurricane-dorian-alabama-sharpie-map"),
  event("2020-09-23", "Won't commit to a peaceful transfer of power",
    "A basic democracy question. Apparently a tricky one.", "ABC News",
    "https://abcnews.com/Politics/president-trump-declines-commit-peaceful-transfer-power/story?id=73205708"),
  event("2023-08-24", "Posts his mugshot with 'NEVER SURRENDER!'",
    "Posted just after surrendering to authorities. Timing is everything.", "Associated Press",
    "https://www.news4jax.com/news/politics/2023/08/25/trump-returns-to-x-the-site-formerly-known-as-twitter-shortly-after-surrendering-in-georgia/"),
];
