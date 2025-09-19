import { NextRequest, NextResponse } from 'next/server';
import { collections } from '@/lib/db';
import { Resend } from 'resend';
import { formatInTimeZone } from 'date-fns-tz';

const resend = new Resend(process.env.RESEND_API_KEY!);

function floorMinute(d: Date) {
  const x = new Date(d);
  x.setSeconds(0, 0);
  return x;
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  if (token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { blocks } = await collections();
  const now = new Date();
  const targetStart = floorMinute(new Date(now.getTime() + 10 * 60 * 1000));
  const nextMinute = new Date(targetStart.getTime() + 60 * 1000);

  const candidates = await blocks.find({
    startAt: { $gte: targetStart, $lt: nextMinute },
    reminder10Sent: { $ne: true },
  }).toArray();

  let sent = 0;
  for (const blk of candidates) {
    const claimed = await blocks.findOneAndUpdate(
      { _id: blk._id, reminder10Sent: { $ne: true } },
      { $set: { reminder10Sent: true, reminder10SentAt: new Date() } },
      { returnDocument: 'after' }
    );
    if (!claimed.value) continue;

    const tz = blk.timezone || 'UTC';
    const humanStart = formatInTimeZone(blk.startAt, tz, "EEE MMM d, yyyy • h:mm a '('zzz')'");
    const durationMin = Math.round((blk.endAt.getTime() - blk.startAt.getTime()) / 60000);

    try {
      await resend.emails.send({
        from: process.env.EMAIL_FROM!,
        to: blk.userEmail,
        subject: 'Reminder: Quiet Hours starts in 10 minutes',
        text: [
          `Hi there!`,
          ``,
          `Your quiet hours "${blk.title || 'Focus Time'}" starts at ${humanStart}.`,
          `Duration: ${durationMin} minutes.`,
          ``,
          `Time to prepare for focused work!`,
          ``,
          `Best regards,`,
          `Quiet Hours Scheduler`,
        ].join('\n'),
      });
      sent++;
    } catch (e) {
      await blocks.updateOne(
        { _id: blk._id },
        { $set: { reminder10Sent: false }, $unset: { reminder10SentAt: "" } }
      );
      console.error('Email send failed for block', blk._id, e);
    }
  }

  return NextResponse.json({ checked: candidates.length, sent });
}