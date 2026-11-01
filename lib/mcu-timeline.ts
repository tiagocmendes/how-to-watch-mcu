export type MCUContentType = 'movie' | 'tv'

export interface MCUItem {
  id: string
  title: string
  tmdbQuery: string
  mediaType: MCUContentType
  releaseYear: number
  season?: number
  timelinePosition: number
  tmdbId: number | null
  tmdbTitle: string | null
  posterPath: string | null
  backdropPath: string | null
  overview: string
  releaseDate: string | null
  rating: number | null
}

export type MCUItemSource = Omit<
  MCUItem,
  | 'timelinePosition'
  | 'tmdbId'
  | 'tmdbTitle'
  | 'posterPath'
  | 'backdropPath'
  | 'overview'
  | 'releaseDate'
  | 'rating'
>

export interface MCUCatalogResponse {
  configured: boolean
  items: MCUItem[]
  error?: 'TMDB_API_KEY_MISSING' | 'TMDB_UNAVAILABLE'
}

export interface MCUDetails {
  tmdbTitle: string | null
  tagline: string | null
  overview: string
  releaseDate: string | null
  runtime: number | null
  runtimeKind: 'film' | 'episode'
  genres: string[]
  rating: number | null
  posterPath: string | null
  backdropPath: string | null
  director: string | null
  directorLabel: string | null
  cast: string[]
  trailerUrl: string | null
}

const movie = (
  id: string,
  title: string,
  releaseYear: number,
  tmdbQuery = title,
): MCUItemSource => ({ id, title, tmdbQuery, mediaType: 'movie', releaseYear })

const series = (
  id: string,
  title: string,
  releaseYear: number,
  tmdbQuery = title,
  season?: number,
): MCUItemSource => ({
  id,
  title,
  tmdbQuery,
  mediaType: 'tv',
  releaseYear,
  ...(season === undefined ? {} : { season }),
})

const timeline: MCUItemSource[] = [
  series('eyes-of-wakanda', 'Eyes of Wakanda', 2025),
  movie('captain-america-first-avenger', 'Captain America: The First Avenger', 2011),
  movie('one-shot-agent-carter', 'Marvel Studios One Shot: Agent Carter', 2013, 'Marvel One-Shot: Agent Carter'),
  movie('captain-marvel', 'Captain Marvel', 2019),
  movie('iron-man', 'Iron Man', 2008),
  movie('iron-man-2', 'Iron Man 2', 2010),
  movie('incredible-hulk', 'The Incredible Hulk', 2008),
  movie(
    'one-shot-funny-thing',
    'Marvel Studios One Shot: A Funny Thing Happened on the Way to Thor’s Hammer',
    2011,
    'Marvel One-Shot: A Funny Thing Happened on the Way to Thor’s Hammer',
  ),
  movie('thor', 'Thor', 2011),
  movie('one-shot-consultant', 'Marvel Studios One Shot: The Consultant', 2011, 'Marvel One-Shot: The Consultant'),
  movie('avengers', 'The Avengers', 2012),
  movie('one-shot-item-47', 'Marvel Studios One Shot: Item 47', 2012, 'Marvel One-Shot: Item 47'),
  movie('thor-dark-world', 'Thor: The Dark World', 2013),
  movie('iron-man-3', 'Iron Man 3', 2013),
  movie('one-shot-all-hail-the-king', 'Marvel Studios One Shot: All Hail the King', 2014, 'Marvel One-Shot: All Hail the King'),
  movie('captain-america-winter-soldier', 'Captain America: The Winter Soldier', 2014),
  movie('guardians-of-the-galaxy', 'Guardians of the Galaxy', 2014),
  movie('guardians-of-the-galaxy-vol-2', 'Guardians of the Galaxy Vol. 2', 2017),
  series('i-am-groot-s1', 'I Am Groot S1', 2022, 'I Am Groot', 1),
  series('i-am-groot-s2', 'I Am Groot S2', 2023, 'I Am Groot', 2),
  series('daredevil-s1', 'Daredevil S1', 2015, 'Daredevil', 1),
  series('jessica-jones-s1', 'Jessica Jones S1', 2015, 'Jessica Jones', 1),
  movie('avengers-age-of-ultron', 'Avengers: Age of Ultron', 2015),
  movie('ant-man', 'Ant-Man', 2015),
  series('daredevil-s2', 'Daredevil S2', 2016, 'Daredevil', 2),
  series('luke-cage-s1', 'Luke Cage S1', 2016, 'Luke Cage', 1),
  series('iron-fist-s1', 'Iron Fist S1', 2017, 'Iron Fist', 1),
  series('the-defenders', 'The Defenders', 2017),
  movie('captain-america-civil-war', 'Captain America: Civil War', 2016),
  movie('black-widow', 'Black Widow', 2021),
  movie('black-panther', 'Black Panther', 2018),
  movie('spider-man-homecoming', 'Spider-Man: Homecoming', 2017),
  series('the-punisher-s1', 'The Punisher S1', 2017, 'The Punisher', 1),
  movie('doctor-strange', 'Doctor Strange', 2016),
  series('jessica-jones-s2', 'Jessica Jones S2', 2018, 'Jessica Jones', 2),
  series('luke-cage-s2', 'Luke Cage S2', 2018, 'Luke Cage', 2),
  series('iron-fist-s2', 'Iron Fist S2', 2018, 'Iron Fist', 2),
  series('daredevil-s3', 'Daredevil S3', 2018, 'Daredevil', 3),
  movie('thor-ragnarok', 'Thor: Ragnarok', 2017),
  series('the-punisher-s2', 'The Punisher S2', 2019, 'The Punisher', 2),
  series('jessica-jones-s3', 'Jessica Jones S3', 2019, 'Jessica Jones', 3),
  movie('ant-man-and-the-wasp', 'Ant-Man and the Wasp', 2018),
  movie('avengers-infinity-war', 'Avengers: Infinity War', 2018),
  movie('avengers-endgame', 'Avengers: Endgame', 2019),
  series('loki-s1', 'Loki S1', 2021, 'Loki', 1),
  series('what-if-s1', 'What If…? S1', 2021, 'What If...?', 1),
  series('marvel-zombies', 'Marvel Zombies', 2025),
  series('wandavision', 'WandaVision', 2021),
  movie('shang-chi', 'Shang-Chi and the Legend of the Ten Rings', 2021),
  series('falcon-and-winter-soldier', 'The Falcon and the Winter Soldier', 2021),
  movie('spider-man-far-from-home', 'Spider-Man: Far From Home', 2019),
  movie('eternals', 'Eternals', 2021),
  movie('spider-man-no-way-home', 'Spider-Man: No Way Home', 2021),
  movie('doctor-strange-multiverse', 'Doctor Strange in the Multiverse of Madness', 2022),
  series('hawkeye', 'Hawkeye', 2021),
  series('moon-knight', 'Moon Knight', 2022),
  movie('black-panther-wakanda-forever', 'Black Panther: Wakanda Forever', 2022),
  series('echo', 'Echo', 2024),
  series('she-hulk', 'She-Hulk: Attorney at Law', 2022),
  series('ms-marvel', 'Ms. Marvel', 2022),
  movie('thor-love-and-thunder', 'Thor: Love and Thunder', 2022),
  series('ironheart', 'Ironheart', 2025),
  movie('werewolf-by-night', 'Werewolf By Night', 2022),
  movie('guardians-holiday-special', 'The Guardians of the Galaxy Holiday Special', 2022),
  movie('ant-man-quantumania', 'Ant-Man and the Wasp: Quantumania', 2023),
  movie('guardians-of-the-galaxy-vol-3', 'Guardians of the Galaxy Vol. 3', 2023),
  series('secret-invasion', 'Secret Invasion', 2023),
  movie('the-marvels', 'The Marvels', 2023),
  series('loki-s2', 'Loki S2', 2023, 'Loki', 2),
  series('what-if-s2', 'What If…? S2', 2023, 'What If...?', 2),
  movie('deadpool-and-wolverine', 'Deadpool & Wolverine', 2024),
  series('agatha-all-along', 'Agatha All Along', 2024),
  series('what-if-s3', 'What If…? S3', 2024, 'What If...?', 3),
  series('daredevil-born-again-s1', 'Daredevil: Born Again S1', 2025, 'Daredevil: Born Again', 1),
  movie('captain-america-brave-new-world', 'Captain America: Brave New World', 2025),
  movie('thunderbolts', 'Thunderbolts*', 2025),
  movie('fantastic-four-first-steps', 'The Fantastic Four: First Steps', 2025),
  series('wonder-man', 'Wonder Man', 2026),
  series('daredevil-born-again-s2', 'Daredevil: Born Again S2', 2026, 'Daredevil: Born Again', 2),
  movie('punisher-one-last-kill', 'The Punisher: One Last Kill', 2026),
  series('visionquest', 'VisionQuest', 2026),
]

export const MCU_TIMELINE: MCUItem[] = timeline.map((item, index) => ({
  ...item,
  timelinePosition: index + 1,
  tmdbId: null,
  tmdbTitle: null,
  posterPath: null,
  backdropPath: null,
  overview: '',
  releaseDate: null,
  rating: null,
}))
