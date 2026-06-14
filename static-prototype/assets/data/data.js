// Sample/mock data for local development.
// Replace this object (or the loader in main.js) with a live API call when a backend is ready.
window.DASHBOARD_DATA = {
  "meta": {
    "country": "Kenya",
    "lastUpdated": "2026-06-14T08:00:00+03:00",
    "reportingPeriod": "14 June 2026",
    "daysSinceLastCase": 3
  },
  "summary": {
    "suspectedCases": { "total": 142, "male": 76, "female": 66 },
    "confirmedCasesTotal": { "total": 38, "male": 21, "female": 17 },
    "newConfirmed24h": { "total": 2, "male": 1, "female": 1 },
    "currentlyAdmitted": { "total": 9, "male": 5, "female": 4 },
    "totalDeaths": { "total": 14, "male": 8, "female": 6 },
    "newDeaths24h": { "total": 0, "male": 0, "female": 0 },
    "totalRecoveries": { "total": 15, "male": 8, "female": 7 },
    "newRecoveries24h": { "total": 1, "male": 1, "female": 0 },
    "caseFatalityRate": 0.368,
    "activeCases": 9
  },
  "pointsOfEntry": {
    "screened": 48210,
    "suspectedCases": 23,
    "contactsListed": { "total": 31, "male": 18, "female": 13 },
    "byEntryPoint": [
      { "name": "Busia (Land)", "screened": 18420, "suspected": 9 },
      { "name": "Malaba (Land)", "screened": 12600, "suspected": 5 },
      { "name": "JKIA (Air)", "screened": 9870, "suspected": 4 },
      { "name": "Lwakhakha (Land)", "screened": 4310, "suspected": 3 },
      { "name": "Suam (Land)", "screened": 3010, "suspected": 2 }
    ]
  },
  "healthFacilities": {
    "suspectedCases": { "total": 119, "male": 64, "female": 55 },
    "newConfirmed24h": { "total": 2, "male": 1, "female": 1 },
    "totalConfirmed": { "total": 38, "male": 21, "female": 17 },
    "currentlyAdmitted": { "total": 9, "male": 5, "female": 4 },
    "newDeaths24h": { "total": 0, "male": 0, "female": 0 },
    "totalDeaths": { "total": 14, "male": 8, "female": 6 },
    "newRecoveries24h": { "total": 1, "male": 1, "female": 0 },
    "totalRecoveries": { "total": 15, "male": 8, "female": 7 },
    "caseFatalityRate": 0.368,
    "contactsListed": { "total": 214, "male": 112, "female": 102 },
    "contactsFollowedUp": { "total": 198, "male": 104, "female": 94 }
  },
  "community": {
    "signalsGenerated": 67,
    "verifiedSignalsLinked": { "total": 21, "male": 12, "female": 9 },
    "contactsTraced": { "total": 176, "male": 92, "female": 84 }
  },
  "labs": {
    "testsDone": 312,
    "positiveTests": 38,
    "negativeTests": 274,
    "turnaroundTimeHrs": 14.2
  },
  "trend": [
    { "date": "2026-06-07", "suspected": 9, "confirmed": 3, "deaths": 1, "recoveries": 0 },
    { "date": "2026-06-08", "suspected": 11, "confirmed": 4, "deaths": 1, "recoveries": 1 },
    { "date": "2026-06-09", "suspected": 14, "confirmed": 4, "deaths": 2, "recoveries": 0 },
    { "date": "2026-06-10", "suspected": 16, "confirmed": 5, "deaths": 2, "recoveries": 1 },
    { "date": "2026-06-11", "suspected": 13, "confirmed": 6, "deaths": 3, "recoveries": 2 },
    { "date": "2026-06-12", "suspected": 12, "confirmed": 7, "deaths": 3, "recoveries": 2 },
    { "date": "2026-06-13", "suspected": 10, "confirmed": 8, "deaths": 1, "recoveries": 1 },
    { "date": "2026-06-14", "suspected": 8, "confirmed": 8, "deaths": 1, "recoveries": 1 }
  ],
  "counties": [
    { "county": "Busia",      "suspected": 41, "confirmed": 16, "deaths": 6, "recoveries": 7, "admitted": 3 },
    { "county": "Bungoma",    "suspected": 28, "confirmed": 9,  "deaths": 3, "recoveries": 4, "admitted": 2 },
    { "county": "Kakamega",   "suspected": 19, "confirmed": 5,  "deaths": 2, "recoveries": 2, "admitted": 1 },
    { "county": "Trans Nzoia","suspected": 15, "confirmed": 4,  "deaths": 1, "recoveries": 1, "admitted": 2 },
    { "county": "Nairobi",    "suspected": 22, "confirmed": 3,  "deaths": 1, "recoveries": 1, "admitted": 1 },
    { "county": "Kiambu",     "suspected": 9,  "confirmed": 1,  "deaths": 1, "recoveries": 0, "admitted": 0 },
    { "county": "Mombasa",    "suspected": 8,  "confirmed": 0,  "deaths": 0, "recoveries": 0, "admitted": 0 }
  ]
};
