export async function mockVerifyPlayerId(params: {
  playerId: string;
  zoneId: string | null;
  hasZoneId: boolean;
}): Promise<{ ok: boolean; message: string }> {
  await new Promise((r) => setTimeout(r, 700));
  const pid = params.playerId.trim();
  if (pid.length < 3) {
    return { ok: false, message: "Player ID kamida 3 belgi bo'lsin." };
  }
  if (params.hasZoneId) {
    const z = (params.zoneId ?? '').trim();
    if (!z) {
      return { ok: false, message: 'Zone ID kiritilishi shart.' };
    }
  }
  return { ok: true, message: "O'yinchi ID muvaffaqiyatli tekshirildi (mock)." };
}
