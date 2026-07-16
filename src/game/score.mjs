export function buildRunResult(course, run, delivery, meters) {
  const cargo = meters.get("cargo-condition")?.value ?? 100;
  const truck = meters.get("truck-condition")?.value ?? 100;
  const cargoPenalty = (100 - cargo) * 0.55;
  const damagePenalty = (100 - truck) * 0.2;
  const distancePenalty = Math.max(0, run.distance - course.scoring.parDistance) / 55;
  const adjustedTime = run.rawTime + run.penaltyTotal + cargoPenalty + damagePenalty + distancePenalty;
  const versusPar = adjustedTime - course.scoring.parTimeSeconds;
  const rating = versusPar <= -45 ? "Eagle" : versusPar <= -15 ? "Birdie" : versusPar <= 20 ? "Par" : versusPar <= 60 ? "Bogey" : "Double Bogey";
  return {
    courseId: course.packageId,
    seed: course.seed,
    validDepotId: delivery.validDepotId,
    rawTime: run.rawTime,
    distance: run.distance,
    parTime: course.scoring.parTimeSeconds,
    parDistance: course.scoring.parDistance,
    depotsChecked: delivery.checkedDepotIds.length,
    collisions: run.collisions,
    cargoCondition: cargo,
    truckCondition: truck,
    penaltyTotal: run.penaltyTotal,
    cargoPenalty,
    damagePenalty,
    distancePenalty,
    adjustedTime,
    versusPar,
    score: rating
  };
}
