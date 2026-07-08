import { DISEASES } from "../diseases.js";

export const name = "mock";

const POES = [
  "JKIA (Nairobi)",
  "Mombasa",
  "Moyale",
  "Busia",
  "Malaba",
  "Namanga",
  "Isebania",
  "Lunga Lunga",
  "Taveta",
  "Lokichogio",
  "Wajir",
  "Kisumu",
  "Eldoret",
];

const READINESS = [
  "HCWs sensitised",
  "HCWs trained",
  "Surge capacity",
  "Labs",
  "Total beds",
];

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function round1(value) {
  return Math.round(value * 10) / 10;
}

function isoDate(daysAgo) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

function diseaseProfile(diseaseName) {
  switch (String(diseaseName || "").toLowerCase()) {
    case "mpox":
      return { dailyTests: [8, 24], positiveRate: [0.02, 0.08], suspected: [20, 90], confirmed: [2, 14] };
    case "marburg":
      return { dailyTests: [2, 14], positiveRate: [0, 0.04], suspected: [4, 36], confirmed: [0, 5] };
    case "ebola":
    default:
      return { dailyTests: [4, 22], positiveRate: [0, 0.06], suspected: [12, 64], confirmed: [0, 8] };
  }
}

export async function lab(diseaseName) {
  const profile = diseaseProfile(diseaseName);
  const trend = Array.from({ length: 14 }, (_, index) => {
    const date = isoDate(13 - index);
    const tests = rand(profile.dailyTests[0], profile.dailyTests[1]);
    const positive = Math.min(tests, Math.round(tests * (Math.random() * (profile.positiveRate[1] - profile.positiveRate[0]) + profile.positiveRate[0])));
    const inconclusive = rand(0, Math.min(2, Math.max(0, tests - positive)));
    const negative = Math.max(0, tests - positive - inconclusive);
    return { date, tests, positive, negative, inconclusive };
  });

  const testsDone = trend.reduce((sum, point) => sum + point.tests, 0);
  const positive = trend.reduce((sum, point) => sum + point.positive, 0);
  const negative = trend.reduce((sum, point) => sum + point.negative, 0);
  const inconclusive = trend.reduce((sum, point) => sum + point.inconclusive, 0);

  return {
    available: true,
    testsDone,
    positive,
    negative,
    inconclusive,
    pendingResults: rand(0, 9),
    positivityPct: testsDone ? round1((positive / testsDone) * 100) : 0,
    patientsTested: testsDone + rand(0, 12),
    avgTatDays: round1(Math.random() * 1.8 + 0.6),
    firstTest: trend[0].date,
    lastTest: trend[trend.length - 1].date,
    newTested24h: trend[trend.length - 1].tests,
    trend: trend.map(({ date, tests, positive: pos, negative: neg }) => ({
      date,
      tests,
      positive: pos,
      negative: neg,
    })),
  };
}

export async function cases(diseaseName) {
  const profile = diseaseProfile(diseaseName);
  const suspected = rand(profile.suspected[0], profile.suspected[1]);
  const confirmed = rand(profile.confirmed[0], profile.confirmed[1]);
  const probable = rand(0, Math.max(2, Math.floor(suspected / 12)));
  const deaths = confirmed ? rand(0, Math.max(0, Math.floor(confirmed * 0.35))) : 0;
  const recoveries = confirmed ? rand(0, Math.max(0, confirmed - deaths)) : 0;
  const admitted = Math.max(0, confirmed - deaths - recoveries);
  const contactsListed = confirmed ? rand(confirmed * 4, confirmed * 18 + 8) : rand(8, 40);
  const contactsFollowedUp = rand(Math.floor(contactsListed * 0.55), contactsListed);

  return {
    available: true,
    totalCases: suspected + confirmed + probable,
    suspected,
    confirmed,
    probable,
    deaths,
    recoveries,
    admitted,
    newConfirmed24h: confirmed ? rand(0, Math.min(2, confirmed)) : 0,
    contactsListed,
    contactsFollowedUp,
    withSpecimenId: rand(Math.floor(suspected * 0.45), suspected + confirmed),
  };
}

export async function poe() {
  const byPoe = POES.map((name) => {
    const screened = rand(350, 13500);
    return {
      name,
      screened,
      uniqueTravelers: rand(Math.floor(screened * 0.72), screened),
      alerts: rand(0, 8),
      unknown: false,
    };
  });

  return {
    available: true,
    totalScreened: byPoe.reduce((sum, row) => sum + row.screened, 0),
    uniqueTravelers: byPoe.reduce((sum, row) => sum + row.uniqueTravelers, 0),
    alerts: byPoe.reduce((sum, row) => sum + row.alerts, 0),
    byPoe,
    note: "Mock point-of-entry screening data for UI development.",
  };
}

export async function readiness() {
  return {
    available: true,
    metrics: READINESS.map((label) => ({
      label,
      value: label === "Labs" ? rand(3, 6) : rand(45, 3200),
    })),
  };
}

export async function testsByDisease() {
  return Promise.all(
    DISEASES.map(async (disease) => {
      const section = await lab(disease.name);
      return { disease: disease.name, total: section.testsDone };
    })
  );
}
