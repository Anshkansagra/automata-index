// arXiv category codes we pull from — robotics, ML, DL, CV, AI, and adjacent
// controls/systems work (autonomous vehicles, digital twins live here too,
// since arXiv has no dedicated category for them).
export const ARXIV_CATEGORIES = [
  "cs.RO", // Robotics
  "cs.LG", // Machine Learning
  "cs.AI", // Artificial Intelligence
  "cs.CV", // Computer Vision
  "cs.NE", // Neural and Evolutionary Computing
  "stat.ML", // Machine Learning (Statistics)
  "eess.SY", // Systems and Control (autonomous vehicles, digital twins)
  "cs.SY", // Systems and Control (cross-listed)
  "cs.NI", // Networking (internet of vehicles, wireless communication)
  "eess.SP", // Signal Processing (wireless comms, satellite navigation)
  "cs.HC", // Human-Computer Interaction (human-machine collaboration)
  "cs.AR", // Hardware Architecture (VLSI, chip design)
  "cs.SE", // Software Engineering (CI/CD for ML, MLOps)
];

// cs.LG/cs.CV/cs.AI each publish hundreds of papers a day; these categories
// publish a handful. When every category is pooled into one query sorted by
// date, the high-volume ones crowd the low-volume ones out almost entirely
// (verified: VLSI/chip-design search results stayed in the single digits
// despite cs.AR already being in ARXIV_CATEGORIES above). ingestArxiv() gives
// each of these its own dedicated fetch so they get a guaranteed slice
// instead of competing for space in the shared pool.
export const UNDERREPRESENTED_ARXIV_CATEGORIES = [
  "cs.AR", // Hardware Architecture (VLSI, chip design)
  "cs.SE", // Software Engineering (CI/CD for ML, MLOps)
];
