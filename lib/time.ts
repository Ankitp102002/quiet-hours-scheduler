export function roundDownToMinute(d: Date) {
  const x = new Date(d);
  x.setSeconds(0, 0);
  return x;
}

export function enumerateMinuteSlots(start: Date, end: Date) {
  const slots: Date[] = [];
  const cur = roundDownToMinute(start);
  const endFloor = roundDownToMinute(end);
  while (cur < endFloor) {
    slots.push(new Date(cur));
    cur.setMinutes(cur.getMinutes() + 1);
  }
  return slots;
}