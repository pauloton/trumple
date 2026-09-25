// Editorially verified weekly additions. Dates refer to the event, not the
// publication date. Preserve past editions when adding a new week's stories.
const card = (date, slug, title, hint, significance, category, name, url) => ({
  id: `${date}-${slug}`, date, title, hint, significance, category,
  trumpleScore: significance, status: "approved", dateBasis: "editorial-review", sources: [{ name, url }],
});

export const WEEKLY_CURATED_EVENTS = [
  card("2026-09-14", "ai-safety-conspiracy", "Calls AI safety fears a sick conspiracy",
    "Safety warnings? Apparently a plot to help China.", 4, "Conspiracy",
    "CBS News", "https://www.cbsnews.com/news/trump-dismisses-ai-regulation-tech-slowdown/"),
  card("2026-09-14", "mail-ballot-court-defeat", "Loses his mail-ballot crackdown at Supreme Court",
    "His last-minute voting overhaul hit a judicial brick wall.", 5, "Power grab",
    "Associated Press", "https://apnews.com/article/trump-mail-voting-executive-order-lawsuit-78a4fbeb48d9c5fd27d1c865529fc65f"),
  card("2026-09-16", "fema-election-joke", "Jokes FEMA aid depends on his candidate winning",
    "No Whatley win, no Helene aid. Then came the 'only kidding'.", 5, "Norm-breaking",
    "WUNC / BPR News", "https://www.wunc.org/2026-09-17/trump-kids-that-hell-only-send-more-fema-funding-to-wnc-if-whatley-wins-senate-race"),
  card("2026-09-16", "fed-rate-rant", "Demands 1% rates as his own Fed pick raises them",
    "His handpicked chairman backed a hike. Cue the all-caps rate-cut demand.", 4, "Grievance",
    "Reuters", "https://www.aol.ca/articles/trump-says-us-interest-rates-204406000.html"),
  card("2026-09-18", "press-access-ban", "Says CNN, MS NOW and Politico are banned",
    "Bad coverage? Lose your White House access. That was his announcement.", 5, "Retaliation",
    "Associated Press", "https://apnews.com/article/bb675679fb10738a51bef90bde6c525a"),
  card("2026-09-18", "greenland-control-claim", "Claims permanent control of Greenland security",
    "Security rights, not ownership. The victory lap came anyway.", 4, "Spectacle",
    "Associated Press", "https://apnews.com/article/trump-greenland-military-denmark-0eac9ad2196551525bcb8c71e80c480e"),
  card("2026-09-19", "rename-ai-poll", "Launches a poll to rename artificial intelligence",
    "Superior, Extreme or Supreme? Apparently AI needed rebranding.", 4, "Absurdity",
    "TechCrunch", "https://techcrunch.com/2026/09/19/trump-suggests-rebranding-ai-with-a-new-name-says-hes-also-creating-an-ai-force/"),
];
