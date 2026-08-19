// Hand-curated from reputable news reporting. These are not raw headlines.
// Each card must be distinctly Trumpian, clearly dated, and independently auditable.
const AP_FIRST_100 = { name: "Associated Press", url: "https://apnews.com/article/feb30c5745a614cd0fe25a639d0cfb71" };
const AP_FUNDING_FREEZE = { name: "Associated Press", url: "https://apnews.com/article/87f4951ad01ea2782ef5290642b0305e" };
const AP_TREASURY = { name: "Associated Press", url: "https://apnews.com/article/5733f8985e4cf7ad5b233fddefef4d01" };
const AP_PENNY = { name: "Associated Press", url: "https://apnews.com/article/192e3b9ad9891d50e7014997653051ba" };
const AP_THIRD_TERM = { name: "Associated Press", url: "https://apnews.com/article/efba31be02ee96b0ef68b17fe89b7578" };
const TIME_POPE = { name: "Time", url: "https://time.com/7282376/president-trump-as-pope-image-social-media-papal-conclave-comments/" };
const AP_QATAR_JET = { name: "Associated Press", url: "https://apnews.com/article/c4e1d73c3dbe18397c10e3d3d267bcd6" };
const AP_SOUTH_AFRICA = { name: "Associated Press", url: "https://apnews.com/article/0080e7c7288860bd0511b8cc4efd06f6" };
const AP_LOS_ANGELES = { name: "Associated Press", url: "https://apnews.com/article/6df36485dec1df2350d5b7be0882a703" };
const AP_ALLIGATOR = { name: "Associated Press", url: "https://apnews.com/article/5dc5568ec15534947c29c9149b773d1d" };
const AP_EPSTEIN = { name: "Associated Press", url: "https://apnews.com/article/a143076353acbc1193cb9697e7fc4a90" };
const GUARDIAN_BIZARRE = { name: "The Guardian", url: "https://www.theguardian.com/us-news/2026/jan/23/trump-concerning-moments" };
const AP_DC_TOUR = { name: "Associated Press", url: "https://apnews.com/article/d0408cee60baa86ab6af5e3d7c60eaa5" };
const AP_FIFA = { name: "Associated Press", url: "https://apnews.com/article/e14f95b8adaa197c869cad407b6ef604" };
const AP_FIRST_YEAR = { name: "Associated Press", url: "https://apnews.com/article/14b80deef025093376f7c04bcd5d51fd" };
const GUARDIAN_NEW_YEAR = { name: "The Guardian", url: "https://www.theguardian.com/us-news/2026/jan/02/trump-administration-news-latest-updates" };
const AP_IRAN = { name: "Associated Press", url: "https://apnews.com/article/ac3716879da0f760bca1c47040ebed4d" };

const card = (id, date, title, hint, significance, category, source) => ({
  id, date, title, hint, significance, category, trumpleScore: significance, sources: [source], status: "approved",
});

export const CURATED_NEWS_EVENTS = [
  card("2025-01-20-birthright-order", "2025-01-20", "Tries to edit the 14th Amendment by order", "He ordered an end to birthright citizenship. A federal judge needed very little time to call it blatantly unconstitutional.", 5, "Power grab", AP_FIRST_100),
  card("2025-01-20-territorial-expansion", "2025-01-20", "Promises American territorial expansion", "The inaugural address included a promise to expand US territory. Canada, Greenland, and Panama had already heard the sales pitch.", 4, "Spectacle", AP_FIRST_100),
  card("2025-01-21-dei-offices", "2025-01-21", "Puts every federal DEI worker on leave", "The order demanded closures, layoffs, and a hunt for anyone hiding diversity work behind less offensive nouns.", 4, "Power grab", AP_FIRST_100),
  card("2025-01-21-health-muzzle", "2025-01-21", "Muzzles federal health agencies", "Scientific meetings and public updates abruptly stopped while political appointees installed a new approval valve.", 4, "Power grab", AP_FIRST_100),
  card("2025-01-22-sensitive-locations", "2025-01-22", "Lets immigration raids into churches", "Schools, hospitals, weddings, funerals, and houses of worship lost their protected-location guidance in one sweep.", 5, "Norm-breaking", AP_FIRST_100),
  card("2025-01-24-canada-state", "2025-01-24", "Keeps pitching Canada as the 51st state", "Wildfire recovery could wait. The visiting president used the press conference to continue shopping for a neighboring country.", 4, "Spectacle", AP_FIRST_100),
  card("2025-01-27-trump-prosecutors", "2025-01-27", "Fires lawyers who prosecuted him", "Career prosecutors from his criminal cases were dismissed because the department said they could not be trusted with his agenda.", 5, "Retaliation", AP_FIRST_100),
  card("2025-01-29-funding-freeze-reversal", "2025-01-29", "Unfreezes trillions after two days of panic", "A sweeping federal funding freeze jammed portals, rattled programs, met a judge, and vanished almost as quickly as it arrived.", 5, "Chaos", AP_FUNDING_FREEZE),
  card("2025-02-01-identity-months", "2025-02-01", "Cancels every Pentagon identity month", "Black History Month, Pride, Women's History Month, Juneteenth, and Holocaust remembrance all made the same deletion list.", 4, "Culture war", AP_FIRST_100),
  card("2025-02-03-usaid-shutdown", "2025-02-03", "Lets Musk feed USAID into the wood chipper", "The aid agency's website went dark while Musk announced that he and Trump were shutting the whole thing down.", 5, "Chaos", AP_FIRST_100),
  card("2025-02-03-tiktok-fund", "2025-02-03", "Creates a government fund that might buy TikTok", "The sovereign wealth fund arrived without wealth, but it did arrive with a possible shopping list.", 3, "Spectacle", AP_FIRST_100),
  card("2025-02-08-doge-treasury", "2025-02-08", "Lets Musk into Treasury's payment system", "DOGE reached data tied to trillions in payments and millions of Americans. A judge reached the emergency brake.", 5, "Power grab", AP_TREASURY),
  card("2025-02-09-penny", "2025-02-09", "Fires the penny on Truth Social", "He ordered Treasury to stop minting one-cent coins after the Super Bowl. Congress traditionally handles coinage, but the penny got a post.", 3, "Spectacle", AP_PENNY),
  card("2025-02-11-usaid-watchdog", "2025-02-11", "Fires USAID watchdog after his warning", "The inspector general warned that the dismantling endangered billions in aid. His access badge did not survive the next day.", 5, "Retaliation", AP_FIRST_100),
  card("2025-02-15-air-force-one-tour", "2025-02-15", "Tours a Boeing jet because Air Force One is late", "The presidential aircraft replacement was years behind schedule, so the customer-in-chief went plane shopping in public.", 3, "Spectacle", AP_FIRST_100),
  card("2025-02-26-trump-gaza-video", "2025-02-26", "Posts an AI fantasy called 'Trump Gaza'", "The video imagined a US-occupied resort with golden statues, luxury towers, and Palestinians edited out of their own home.", 5, "Spectacle", AP_FIRST_100),
  card("2025-03-10-khalil", "2025-03-10", "Tries to deport a protest leader with a green card", "Mahmoud Khalil was detained over campus activism. Trump announced that this was the first arrest of many.", 5, "Power grab", AP_FIRST_100),
  card("2025-03-24-signal-chat", "2025-03-24", "Lets a journalist into the war-plans group chat", "The national security team discussed Houthi strikes on Signal. The Atlantic editor received the itinerary by accident.", 5, "Chaos", AP_FIRST_100),
  card("2025-03-30-third-term", "2025-03-30", "Says he is 'not joking' about a third term", "The Constitution said two elections. He said there were methods, then declined to share the other methods.", 5, "Power grab", AP_THIRD_TERM),
  card("2025-05-02-ai-pope", "2025-05-02", "Posts himself as the pope before the conclave", "Days after Pope Francis died, the president shared an AI portrait of himself in papal white and called the backlash a joke.", 4, "Spectacle", TIME_POPE),
  card("2025-05-21-qatar-jet", "2025-05-21", "Accepts Qatar's $400 million jumbo jet", "The palace-in-the-sky gift was destined for Air Force One duty and, eventually, his presidential library.", 5, "Self-dealing", AP_QATAR_JET),
  card("2025-05-21-ramaphosa-video", "2025-05-21", "Ambushes South Africa's president with a video", "He dimmed the Oval Office lights and screened a misleading white-genocide montage. The visiting president had come to discuss trade.", 5, "Spectacle", AP_SOUTH_AFRICA),
  card("2025-06-07-la-guard", "2025-06-07", "Sends the Guard into LA over the governor", "He federalized California's National Guard against Gavin Newsom's wishes, turning several blocks of protest into a military showdown.", 5, "Power grab", AP_LOS_ANGELES),
  card("2025-06-10-liberate-la", "2025-06-10", "Vows to 'liberate' Los Angeles", "At an Army anniversary speech, he called protesters animals and a foreign enemy while Marines waited nearby.", 5, "Escalation", AP_LOS_ANGELES),
  card("2025-06-24-iran-israel-curse", "2025-06-24", "Curses out both sides of his own ceasefire", "Israel and Iran immediately tested his freshly announced truce. The president supplied an extremely presidential F-bomb.", 4, "Chaos", AP_FIRST_YEAR),
  card("2025-07-01-alligator-alcatraz", "2025-07-01", "Tours a migrant prison called Alligator Alcatraz", "He praised the swamp-ringed detention camp and joked that escapees would need to learn how to run from alligators.", 5, "Spectacle", AP_ALLIGATOR),
  card("2025-07-08-gold-monologue", "2025-07-08", "Derails Cabinet with a 13-minute gold lecture", "Floods, wars, and tariffs were on the agenda. He preferred frames, lamps, china, and why paint can never look properly gold.", 4, "Spectacle", GUARDIAN_BIZARRE),
  card("2025-07-15-epstein-boring", "2025-07-15", "Calls the Epstein case 'pretty boring'", "His own movement demanded the files it had been promised. He suddenly could not understand anyone's fascination.", 5, "Own goal", AP_EPSTEIN),
  card("2025-07-16-epstein-weaklings", "2025-07-16", "Calls his Epstein-obsessed fans 'weaklings'", "The conspiracy machine wanted receipts. Its builder responded by insulting the customers and calling the whole case a hoax.", 5, "Own goal", AP_EPSTEIN),
  card("2025-07-22-obama-arrest-video", "2025-07-22", "Posts an AI video of Obama being arrested", "The fake scene showed a former president in handcuffs while Trump revived another conspiracy about the 2016 election.", 5, "Disinformation", AP_EPSTEIN),
  card("2025-07-27-whales-windmills", "2025-07-27", "Tells Europe windmills drive whales 'loco'", "A trade meeting swerved into two uninterrupted minutes about turbines, scenery, dead birds, and distressed whales.", 4, "Rant", GUARDIAN_BIZARRE),
  card("2025-08-11-dc-takeover", "2025-08-11", "Takes over DC police and deploys the Guard", "He declared a crime emergency, seized control of the local police, and sent troops into the capital.", 5, "Power grab", AP_DC_TOUR),
  card("2025-08-22-dc-tourist", "2025-08-22", "Plays DC tourist during his military crackdown", "With Guard troops in the streets, he visited a gift shop and inspected Kennedy Center marble and bathroom plans.", 4, "Spectacle", AP_DC_TOUR),
  card("2025-09-24-un-sabotage", "2025-09-24", "Demands arrests over a stopped UN escalator", "An escalator stopped, his teleprompter failed, and the sound disappointed him. He called all three events sinister sabotage.", 4, "Grievance", GUARDIAN_BIZARRE),
  card("2025-09-30-generals-stairs", "2025-09-30", "Summons the generals and riffs about stairs", "America's top commanders were ordered into one room. Their commander-in-chief explained 'bop, bop, bop' stair technique.", 4, "Spectacle", GUARDIAN_BIZARRE),
  card("2025-10-02-grim-reaper", "2025-10-02", "Posts his budget chief as the Grim Reaper", "During a shutdown, his AI video gave Russell Vought a scythe, a song, and a cheerful mandate to cut the government.", 4, "Spectacle", AP_FIRST_YEAR),
  card("2025-10-03-trump-coin", "2025-10-03", "Puts his own face on a proposed US coin", "Treasury unveiled a $1 coin design with the sitting president on both sides. Subtle numismatics had left the mint.", 4, "Self-branding", AP_FIRST_YEAR),
  card("2025-10-03-ai-2028-hat", "2025-10-03", "Throws a 'Trump 2028' hat in an AI video", "The synthetic clip targeted a Democratic leader and marketed a constitutionally unavailable campaign at the same time.", 4, "Power grab", AP_FIRST_YEAR),
  card("2025-12-02-cabinet-nap", "2025-12-02", "Appears to nap through his Cabinet meeting", "The man who built a brand around Sleepy Joe closed his eyes, drooped, and jerked awake while aides praised his unmatched energy.", 4, "Own goal", GUARDIAN_BIZARRE),
  card("2025-12-05-fifa-peace-prize", "2025-12-05", "Accepts a brand-new FIFA peace prize", "After openly chasing the Nobel, he received a gold trophy and medal from soccer's governing body at the World Cup draw.", 5, "Spectacle", AP_FIFA),
  card("2025-12-17-partisan-plaques", "2025-12-17", "Adds insults to the Presidential Walk of Fame", "New White House plaques described previous presidents in the language of his campaign rallies. History received comment moderation.", 5, "Self-branding", AP_FIRST_YEAR),
  card("2025-12-18-patriot-games", "2025-12-18", "Announces high-school 'Patriot Games'", "One boy and one girl from every state and territory were summoned for a national sporting spectacle in America's 250th year.", 4, "Spectacle", AP_FIRST_YEAR),
  card("2025-12-18-trump-kennedy-center", "2025-12-18", "Gets his name added to the Kennedy Center", "His handpicked board approved the Trump-Kennedy Center while Democratic members said their objections were muted.", 5, "Self-branding", AP_FIRST_YEAR),
  card("2026-01-01-perfect-health", "2026-01-01", "Denies napping and declares his health perfect", "After several visible dozes, he told the public that he was merely closing his eyes because meetings were boring.", 4, "Own goal", GUARDIAN_NEW_YEAR),
  card("2026-01-16-thanks-iran", "2026-01-16", "Thanks Iran for canceling mass hangings", "After threatening strikes, he praised Tehran for executions he said had been stopped. Allies were still trying to lower the temperature.", 4, "Whiplash", AP_IRAN),
  card("2026-01-21-greenland-iceland", "2026-01-21", "Confuses Greenland with Iceland at Davos", "He blamed market trouble on Iceland while discussing his threats against Greenland. The White House insisted everyone else was confused.", 4, "Own goal", GUARDIAN_BIZARRE),
  card("2026-01-23-snow-climate", "2026-01-23", "Says a winter storm proves climate is fake", "A cold forecast became another climate-hoax argument, because weather and global climate remain inconveniently different things.", 4, "Disinformation", GUARDIAN_BIZARRE),
];
