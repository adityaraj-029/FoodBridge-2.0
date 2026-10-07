const calculateDistance = require('./haversine');

// Score: lower distance = higher score, capacity match, urgency based on expiry
const scoreNGO = (donation, ngo) => {
  const distance = calculateDistance(
    donation.pickupLocation.latitude,
    donation.pickupLocation.longitude,
    ngo.location.latitude,
    ngo.location.longitude
  );

  const distanceScore = Math.max(0, 100 - distance * 2); // closer = higher score
  const capacityScore = ngo.capacity >= 10 ? 30 : 15;

  const hoursToExpiry = (new Date(donation.expiryTime) - new Date()) / (1000 * 60 * 60);
  const urgencyScore = hoursToExpiry < 3 ? 40 : hoursToExpiry < 6 ? 25 : 10;

  const totalScore = distanceScore + capacityScore + urgencyScore;
  return { ngo, distance, totalScore };
};

const findBestMatches = (donation, ngoList) => {
  const scored = ngoList
    .filter((ngo) => ngo.isApproved)
    .map((ngo) => scoreNGO(donation, ngo));

  scored.sort((a, b) => b.totalScore - a.totalScore);
  return scored.slice(0, 3); // top 3 matches
};

module.exports = { scoreNGO, findBestMatches };