import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BUILT_IN_TEMPLATES, DEFAULT_EVENT_CHECKLIST } from '@app/shared';
import { db, pool } from './client';
import {
  activityLogs,
  appUsers,
  attachments,
  checklistItems,
  checklistTemplates,
  comments,
  eventPeople,
  events,
  eventTags,
  notes,
  people,
  tags,
  taskAssignees,
  tasks,
  taskTags,
  templateItems,
} from './schema';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_ROOT = path.resolve(__dirname, '../../server/uploads');

const YEAR = 2026;

function d(month: number, day: number, hour = 9, minute = 0): Date {
  return new Date(Date.UTC(YEAR, month - 1, day, hour, minute));
}

async function main() {
  const [existing] = await db.select().from(events).limit(1);
  if (existing) {
    console.log('Seed guard: events already exist, skipping seed. Delete rows or drop the DB to re-seed.');
    await pool.end();
    return;
  }

  console.log('Seeding admin user...');
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@clubops.local';
  const [owner] = await db
    .insert(appUsers)
    .values({ email: adminEmail, name: 'Club Admin' })
    .returning();

  console.log('Seeding checklist templates...');
  for (const [name, items] of Object.entries(BUILT_IN_TEMPLATES)) {
    const [template] = await db
      .insert(checklistTemplates)
      .values({ name, category: name, isBuiltIn: true })
      .returning();
    await db.insert(templateItems).values(
      items.map((label, i) => ({ templateId: template.id, label, order: i })),
    );
  }

  console.log('Seeding people...');
  const peopleRows = await db
    .insert(people)
    .values([
      { name: 'Aditi Sharma', email: 'aditi@example.com', role: 'President', department: 'Board', organization: 'Rotaract Club', skills: ['Leadership', 'Public Speaking'] },
      { name: 'Rahul Verma', email: 'rahul@example.com', role: 'Secretary', department: 'Board', organization: 'Rotaract Club', skills: ['Documentation', 'Coordination'] },
      { name: 'Priya Nair', email: 'priya@example.com', role: 'Treasurer', department: 'Board', organization: 'Rotaract Club', skills: ['Budgeting', 'Excel'] },
      { name: 'Karthik Raj', email: 'karthik@example.com', role: 'Event Coordinator', department: 'Events', organization: 'Rotaract Club', skills: ['Logistics', 'Vendor Management'] },
      { name: 'Sneha Iyer', email: 'sneha@example.com', role: 'Design Lead', department: 'Media', organization: 'Rotaract Club', skills: ['Graphic Design', 'Canva', 'Photoshop'] },
      { name: 'Arjun Menon', email: 'arjun@example.com', role: 'Volunteer Coordinator', department: 'Community Service', organization: 'Rotaract Club', skills: ['Volunteer Management'] },
      { name: 'Divya Krishnan', email: 'divya@example.com', role: 'Social Media Lead', department: 'Media', organization: 'Rotaract Club', skills: ['Instagram', 'Content Writing'] },
      { name: 'Vishal Pillai', email: 'vishal@example.com', role: 'Photographer', department: 'Media', organization: 'Rotaract Club', skills: ['Photography', 'Videography'] },
    ])
    .returning();
  const person = (name: string) => peopleRows.find((p) => p.name === name)!;

  console.log('Seeding tags...');
  const tagRows = await db
    .insert(tags)
    .values([
      { name: 'Flagship', color: '#6366f1' },
      { name: 'Community Service', color: '#10b981' },
      { name: 'Internal', color: '#f59e0b' },
      { name: 'Fundraising', color: '#ef4444' },
      { name: 'Social', color: '#0ea5e9' },
    ])
    .returning();
  const tag = (name: string) => tagRows.find((t) => t.name === name)!;

  // -------------------------------------------------------------------
  // Helper to create an event with a full checklist + a few tasks
  // -------------------------------------------------------------------
  async function createEvent(opts: {
    name: string;
    category: string;
    date: Date;
    venue: string;
    status: 'Planning' | 'InProgress' | 'Completed' | 'Cancelled' | 'OnHold';
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    budget?: string;
    description: string;
    color: string;
    checklistItems?: readonly string[];
    checklistDoneCount?: number;
    tagNames?: string[];
    peopleNames?: string[];
  }) {
    const [event] = await db
      .insert(events)
      .values({
        name: opts.name,
        category: opts.category,
        date: opts.date,
        venue: opts.venue,
        status: opts.status,
        priority: opts.priority,
        budget: opts.budget,
        description: opts.description,
        color: opts.color,
      })
      .returning();

    const checklist = opts.checklistItems ?? DEFAULT_EVENT_CHECKLIST;
    const doneCount = opts.checklistDoneCount ?? 0;
    await db.insert(checklistItems).values(
      checklist.map((label, i) => ({
        eventId: event.id,
        label,
        order: i,
        isDone: i < doneCount,
        completedAt: i < doneCount ? new Date() : null,
      })),
    );

    for (const tagName of opts.tagNames ?? []) {
      await db.insert(eventTags).values({ eventId: event.id, tagId: tag(tagName).id });
    }
    for (const personName of opts.peopleNames ?? []) {
      await db.insert(eventPeople).values({
        eventId: event.id,
        personId: person(personName).id,
        roleOnEvent: 'Organizer',
      });
    }

    await db.insert(activityLogs).values({
      action: 'EVENT_CREATED',
      summary: `Event "${event.name}" was created`,
      eventId: event.id,
      actorUserId: owner.id,
    });

    return event;
  }

  async function createTask(opts: {
    eventId: string;
    title: string;
    description?: string;
    deadline?: Date;
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    status: 'Pending' | 'InProgress' | 'Completed' | 'Blocked' | 'Cancelled';
    assigneeNames?: string[];
    tagNames?: string[];
  }) {
    const [task] = await db
      .insert(tasks)
      .values({
        eventId: opts.eventId,
        title: opts.title,
        description: opts.description,
        deadline: opts.deadline,
        priority: opts.priority,
        status: opts.status,
      })
      .returning();

    for (const name of opts.assigneeNames ?? []) {
      await db.insert(taskAssignees).values({ taskId: task.id, personId: person(name).id });
    }
    for (const tagName of opts.tagNames ?? []) {
      await db.insert(taskTags).values({ taskId: task.id, tagId: tag(tagName).id });
    }

    await db.insert(activityLogs).values({
      action: opts.status === 'Completed' ? 'TASK_COMPLETED' : 'TASK_CREATED',
      summary: `Task "${task.title}" ${opts.status === 'Completed' ? 'was completed' : 'was created'}`,
      eventId: opts.eventId,
      taskId: task.id,
      actorUserId: owner.id,
    });

    return task;
  }

  console.log('Seeding events + tasks across June - September 2026...');

  // June: Orientation (Completed)
  const orientation = await createEvent({
    name: 'Orientation',
    category: 'Orientation',
    date: d(6, 10),
    venue: 'Community Hall',
    status: 'Completed',
    priority: 'Medium',
    description: 'New member orientation session.',
    color: '#0ea5e9',
    checklistDoneCount: DEFAULT_EVENT_CHECKLIST.length,
    tagNames: ['Internal'],
    peopleNames: ['Aditi Sharma', 'Rahul Verma'],
  });
  await createTask({ eventId: orientation.id, title: 'Book community hall', priority: 'Medium', status: 'Completed', deadline: d(6, 5), assigneeNames: ['Karthik Raj'] });
  await createTask({ eventId: orientation.id, title: 'Prepare welcome kits', priority: 'Low', status: 'Completed', deadline: d(6, 8), assigneeNames: ['Sneha Iyer'] });

  // July: Installation, Leadership Seminar
  const installation = await createEvent({
    name: 'Installation',
    category: 'Installation',
    date: d(7, 12),
    venue: 'Grand Ballroom, City Hotel',
    status: 'Completed',
    priority: 'High',
    budget: '75000.00',
    description: 'Annual installation ceremony for the incoming board.',
    color: '#6366f1',
    checklistItems: BUILT_IN_TEMPLATES.Installation,
    checklistDoneCount: BUILT_IN_TEMPLATES.Installation.length,
    tagNames: ['Flagship'],
    peopleNames: ['Aditi Sharma', 'Karthik Raj', 'Sneha Iyer', 'Vishal Pillai'],
  });
  await createTask({ eventId: installation.id, title: 'Finalize chief guest', priority: 'High', status: 'Completed', deadline: d(7, 1), assigneeNames: ['Aditi Sharma'] });
  await createTask({ eventId: installation.id, title: 'Design stage backdrop', priority: 'Medium', status: 'Completed', deadline: d(7, 5), assigneeNames: ['Sneha Iyer'] });
  await createTask({ eventId: installation.id, title: 'Book photographer', priority: 'Medium', status: 'Completed', deadline: d(7, 6), assigneeNames: ['Vishal Pillai'] });

  const leadershipSeminar = await createEvent({
    name: 'Leadership Seminar',
    category: 'Seminar',
    date: d(7, 25),
    venue: 'Conference Room, Club Office',
    status: 'Completed',
    priority: 'Medium',
    budget: '15000.00',
    description: 'Seminar on leadership skills for club members.',
    color: '#10b981',
    checklistItems: BUILT_IN_TEMPLATES.Seminar,
    checklistDoneCount: BUILT_IN_TEMPLATES.Seminar.length,
    tagNames: ['Internal'],
    peopleNames: ['Rahul Verma'],
  });
  await createTask({ eventId: leadershipSeminar.id, title: 'Invite guest speaker', priority: 'High', status: 'Completed', deadline: d(7, 15), assigneeNames: ['Rahul Verma'] });

  // August (current month): Catalyst (Planning/High), District Conference (InProgress)
  const catalyst = await createEvent({
    name: 'Catalyst',
    category: 'Conference',
    date: d(8, 22),
    venue: 'District Convention Centre',
    status: 'Planning',
    priority: 'High',
    budget: '120000.00',
    description: 'Flagship district-level youth leadership conference.',
    color: '#f59e0b',
    checklistDoneCount: 6,
    tagNames: ['Flagship'],
    peopleNames: ['Aditi Sharma', 'Priya Nair', 'Karthik Raj', 'Divya Krishnan'],
  });
  await createTask({ eventId: catalyst.id, title: 'Lock venue contract', priority: 'Critical', status: 'InProgress', deadline: d(8, 3), assigneeNames: ['Karthik Raj'] }); // overdue on purpose
  await createTask({ eventId: catalyst.id, title: 'Finalize sponsor deck', priority: 'High', status: 'Pending', deadline: d(8, 4), assigneeNames: ['Priya Nair'] }); // overdue on purpose
  await createTask({ eventId: catalyst.id, title: 'Design event poster', priority: 'Medium', status: 'InProgress', deadline: d(8, 12), assigneeNames: ['Sneha Iyer'], tagNames: ['Fundraising'] });
  await createTask({ eventId: catalyst.id, title: 'Open registration link', priority: 'High', status: 'Pending', deadline: d(8, 10) });

  const districtConf = await createEvent({
    name: 'District Conference',
    category: 'Conference',
    date: d(8, 29),
    venue: 'District HQ Auditorium',
    status: 'InProgress',
    priority: 'High',
    budget: '95000.00',
    description: 'Annual district-wide conference with all member clubs.',
    color: '#8b5cf6',
    checklistDoneCount: 10,
    tagNames: ['Flagship'],
    peopleNames: ['Aditi Sharma', 'Rahul Verma'],
  });
  await createTask({ eventId: districtConf.id, title: 'Confirm chief guest', priority: 'Critical', status: 'Pending', deadline: d(8, 5) }); // overdue, unassigned on purpose
  await createTask({ eventId: districtConf.id, title: 'Prepare agenda', priority: 'Medium', status: 'InProgress', deadline: d(8, 20), assigneeNames: ['Rahul Verma'] });

  // September: Walkathon, Blood Donation Camp
  const walkathon = await createEvent({
    name: 'Walkathon',
    category: 'Awareness Program',
    date: d(9, 6),
    venue: 'City Marine Drive',
    status: 'Planning',
    priority: 'Medium',
    budget: '30000.00',
    description: 'Community walkathon for health awareness.',
    color: '#ef4444',
    checklistItems: BUILT_IN_TEMPLATES['Awareness Program'],
    checklistDoneCount: 2,
    tagNames: ['Community Service'],
    peopleNames: ['Arjun Menon', 'Divya Krishnan'],
  });
  await createTask({ eventId: walkathon.id, title: 'Get municipal permission', priority: 'High', status: 'Pending', deadline: d(8, 25), assigneeNames: ['Arjun Menon'] });

  const bloodDonation = await createEvent({
    name: 'Blood Donation Camp',
    category: 'Medical Camp',
    date: d(9, 14),
    venue: 'Club Office Grounds',
    status: 'Planning',
    priority: 'High',
    budget: '20000.00',
    description: 'Blood donation drive in partnership with a local hospital.',
    color: '#dc2626',
    checklistItems: BUILT_IN_TEMPLATES['Medical Camp'],
    checklistDoneCount: 3,
    tagNames: ['Community Service'],
    peopleNames: ['Arjun Menon'],
  });
  await createTask({ eventId: bloodDonation.id, title: 'Coordinate with hospital', priority: 'High', status: 'InProgress', deadline: d(9, 1), assigneeNames: ['Arjun Menon'] });

  console.log('Seeding notes + comments...');
  await db.insert(notes).values({
    eventId: catalyst.id,
    title: 'Planning notes',
    bodyMarkdown: '## Catalyst 2026\n\n- Target 300+ attendees\n- Need 2 keynote speakers\n- Confirm AV vendor by Aug 15',
  });
  await db.insert(comments).values({
    eventId: catalyst.id,
    authorUserId: owner.id,
    body: 'Reached out to 3 potential sponsors this week.',
  });
  await db.insert(activityLogs).values({
    action: 'COMMENT_ADDED',
    summary: 'Comment added on "Catalyst"',
    eventId: catalyst.id,
    actorUserId: owner.id,
  });

  console.log('Seeding placeholder attachments...');
  const eventUploadDir = path.join(UPLOAD_ROOT, 'events', catalyst.id);
  fs.mkdirSync(eventUploadDir, { recursive: true });
  const placeholderFile = path.join(eventUploadDir, 'proposal-draft.txt');
  fs.writeFileSync(placeholderFile, 'Catalyst 2026 - Event Proposal (placeholder seed file)\n');
  await db.insert(attachments).values({
    filename: 'proposal-draft.txt',
    storedPath: path.relative(UPLOAD_ROOT, placeholderFile).split(path.sep).join('/'),
    mimeType: 'text/plain',
    sizeBytes: fs.statSync(placeholderFile).size,
    eventId: catalyst.id,
    uploadedByUserId: owner.id,
  });
  await db.insert(activityLogs).values({
    action: 'FILE_UPLOADED',
    summary: 'File "proposal-draft.txt" uploaded to "Catalyst"',
    eventId: catalyst.id,
    actorUserId: owner.id,
  });

  console.log('Seed complete.');
  await pool.end();
}

main().catch(async (err) => {
  console.error('Seed failed:', err);
  await pool.end();
  process.exit(1);
});
