import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { collections, getClient } from '@/lib/db';
import { getUserFromCookies } from '@/lib/auth';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUserFromCookies();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const blockId = params.id;
  if (!ObjectId.isValid(blockId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const { blocks, timeslots } = await collections();
  const client = await getClient();
  const session = client.startSession();

  try {
    await session.withTransaction(async () => {
      const blk = await blocks.findOne({ _id: new ObjectId(blockId), userId: user.id }, { session });
      if (!blk) throw new Error('NOT_FOUND');
      await timeslots.deleteMany({ blockId: blk._id!, userId: user.id }, { session });
      await blocks.deleteOne({ _id: blk._id!, userId: user.id }, { session });
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err?.message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    console.error('Delete block error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  } finally {
    await session.endSession();
  }
}