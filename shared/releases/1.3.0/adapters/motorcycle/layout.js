// One set of chassis anchors for the frame and every attached component.
export function motorcycleLayout(p) {
  const scooter = p.form === "scooter";
  const radius = p.wheelR * (scooter ? 0.82 : 1);
  const rearRadius = radius * (p.form === "chopper" ? 1.05 : 1);
  const frontX = p.wheelbase / 2,
    rearX = -frontX;
  const offroad = ["adventure", "dirt"].includes(p.form);
  const forkLength = 0.62 + p.stance * 0.4 + (offroad ? 0.16 : 0);
  const head = scooter
    ? [frontX - 0.08, radius + 0.95, 0]
    : [
        frontX - Math.sin(p.rake) * forkLength,
        radius + Math.cos(p.rake) * forkLength,
        0,
      ];
  const barWidth = scooter
    ? 0.52
    : p.form === "sport"
      ? 0.34
      : ["cruiser", "chopper", "touring", "adventure", "dirt"].includes(p.form)
        ? 0.62
        : 0.46;
  const bar = [
    scooter ? frontX - 0.1 : head[0] - 0.04,
    head[1] + (scooter ? 0 : p.form === "sport" ? -0.04 : 0.08),
    0,
  ];
  const seatY = radius + (scooter ? 0.82 : p.stance);
  const seatX = scooter ? rearX + 0.2 : -p.wheelbase * 0.18;
  const seatLength = scooter
    ? 0.5
    : p.wheelbase *
      (["cruiser", "touring"].includes(p.form)
        ? 0.5
        : p.form === "dirt"
          ? 0.48
          : 0.4);
  const railY = seatY - (scooter ? 0.075 : 0.025);
  const rearRail = [seatX - seatLength / 2 + 0.02, railY, 0];
  const frontRail = [seatX + seatLength / 2 - 0.02, railY, 0];
  const wheelWidth = p.wheelR * (scooter ? 0.34 : 0.42);
  const railZ = scooter ? 0.14 : wheelWidth * 0.5;
  const lamp = scooter
    ? [frontX + 0.04, radius + 0.7, 0]
    : [head[0] + 0.06, head[1] - 0.12, 0];
  return {
    scooter,
    radius,
    rearRadius,
    frontX,
    rearX,
    head,
    bar,
    barWidth,
    seatY,
    seatX,
    seatLength,
    rearRail,
    frontRail,
    railZ,
    wheelWidth,
    lamp,
  };
}
