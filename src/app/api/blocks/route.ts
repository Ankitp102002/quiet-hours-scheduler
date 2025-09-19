import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { collections } from '@/lib/db';
import { enumerateMinuteSlots } from '@/lib/time';
import { ObjectId } from 'mongodb';
import { getClient } from '@/lib/db';
import { getUserFromCookies } from '@/lib/auth';

const BlockCreateSchema = z.object({
  title: z.string().optional(),
  startAt: z.string(),
  endAt: z.string(),
  timezone: z.string().optional(),
});

export async function GET() {
  const user = await getUserFromCookies();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { blocks } = await collections();
  const data = await blocks
    .find({ userId: user.id })
    .sort({ startAt: 1 })
    .toArray();

  return NextResponse.json(
    data.map(b => ({
      ...b,
      _id: b._id?.toString(),
    }))
  );
}

export async function POST(req: NextRequest) {
  const user = await getUserFromCookies();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = BlockCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { title, timezone } = parsed.data;
  const start = new Date(parsed.data.startAt);
  const end = new Date(parsed.data.endAt);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return NextResponse.json({ error: 'Invalid dates' }, { status: 400 });
  }
  if (end <= start) {
    return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 });
  }
  if (end.getTime() - start.getTime() > 12 * 60 * 60 * 1000) {
    return NextResponse.json({ error: 'Block too long (max 12 hours)' }, { status: 400 });
  }

  const { blocks, timeslots } = await collections();
  const client = await getClient();
  const session = client.startSession();

  const slots = enumerateMinuteSlots(start, end);
  if (slots.length === 0) {
    return NextResponse.json({ error: 'Block must be at least 1 minute long' }, { status: 400 });
  }

  try {
    let insertedId: ObjectId | null = null;
    await session.withTransaction(async () => {
      const now = new Date();
      const blockDoc = {
        userId: user.id,
        userEmail: user.email,
        title,
        startAt: start,
        endAt: end,
        timezone,
        reminder10Sent: false,
        reminder10SentAt: null,
        createdAt: now,
        updatedAt: now,
      };
      const insertRes = await blocks.insertOne(blockDoc, { session });
      insertedId = insertRes.insertedId;

      const tsDocs = slots.map(s => ({
        userId: user.id,
        blockId: insertedId!,
        slotStart: s,
        expiresAt: end,
      }));
      await timeslots.insertMany(tsDocs, { session, ordered: true });
    });

    const created = await blocks.findOne({ _id: insertedId! });
    return NextResponse.json({ ...created, _id: insertedId!.toString() }, { status: 201 });

  } catch (err: any) {
    if (err?.code === 11000) {
      return NextResponse.json({ error: 'You already have a quiet hour scheduled at this time' }, { status: 409 });
    }
    console.error('Create block error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  } finally {
    await session.endSession();
  }
}