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

export async function mockLookupPlayer(params: {
  playerId: string;
  zoneId: string | null;
  hasZoneId: boolean;
}): Promise<{ ok: boolean; displayName: string | null; message: string }> {
  const base = await mockVerifyPlayerId(params);
  if (!base.ok) {
    return { ok: false, displayName: null, message: base.message };
  }
  const tail = params.playerId.trim().slice(-4);
  const zone = params.hasZoneId ? (params.zoneId ?? '').trim() : '';
  const displayName = params.hasZoneId ? `| SkyRush_${tail} · S${zone} |` : `| SkyRush_${tail} |`;
  return { ok: true, displayName, message: base.message };
}
