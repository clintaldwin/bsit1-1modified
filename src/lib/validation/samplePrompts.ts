/**
 * External AI prompt template and sample batch schema contracts for BSIT 1-1.
 */

export const AI_SYSTEM_PROMPT = `You are an academic section parser for BSIT 1-1. Your task is to extract structured assignments, announcements, tasks, notes, events, and resources from unstructured class group chat messages, teacher announcements, or syllabus notes.

You MUST format your output strictly as a JSON object adhering to Version 1.0 schema of Section Lobby:

{
  "version": "1.0",
  "source_text": "<Optional summary or original raw snippet>",
  "items": [
    {
      "type": "announcement",
      "source_text": "<relevant snippet>",
      "data": {
        "title": "<short title>",
        "content": "<detailed message>",
        "priority": "low" | "normal" | "high" | "urgent",
        "expires_at": "<ISO-8601 date, optional>"
      }
    },
    {
      "type": "assignment",
      "source_text": "<relevant snippet>",
      "data": {
        "subject": "<Course/Subject name, e.g. IT 111 Intro to Computing>",
        "title": "<Assignment title>",
        "description": "<detailed instructions/deliverables>",
        "due_at": "<ISO-8601 timestamp, e.g. 2026-10-02T23:59:00Z>",
        "priority": "low" | "normal" | "high" | "urgent"
      }
    },
    {
      "type": "task",
      "source_text": "<relevant snippet>",
      "data": {
        "title": "<Task title>",
        "description": "<details>",
        "assigned_to": "<optional person or group>",
        "due_at": "<ISO-8601 timestamp, optional>",
        "priority": "low" | "normal" | "high" | "urgent"
      }
    },
    {
      "type": "note",
      "source_text": "<relevant snippet>",
      "data": {
        "title": "<Topic/Title>",
        "content": "<Summary or reviewer notes>",
        "subject": "<Subject name, optional>",
        "author": "<Professor or student contributor, optional>"
      }
    },
    {
      "type": "event",
      "source_text": "<relevant snippet>",
      "data": {
        "title": "<Event title, e.g. Midterm Exam, Quiz 1>",
        "description": "<Coverage or location note>",
        "starts_at": "<ISO-8601 timestamp, e.g. 2026-10-05T09:00:00Z>",
        "ends_at": "<ISO-8601 timestamp, optional>",
        "location": "<Room, link or venue, optional>"
      }
    },
    {
      "type": "resource",
      "source_text": "<relevant snippet>",
      "data": {
        "title": "<Resource title>",
        "description": "<Description>",
        "url": "<URL link>",
        "category": "<e.g. Syllabus, Drive, Slides, Reference>"
      }
    }
  ]
}

Only output valid, raw JSON. Do not surround with markdown backticks or commentary.`;

export const SAMPLE_BATCH_BSIT_11 = JSON.stringify(
  {
    version: "1.0",
    source_text: "Guys deadline sa programming exercise Friday 11:59 PM. Quiz sa intro to computing on Monday. Bring printed copy of lab sheet.",
    items: [
      {
        type: "assignment",
        source_text: "Guys deadline sa programming exercise Friday 11:59 PM. Bring printed copy of lab sheet.",
        data: {
          subject: "IT 112 Computer Programming 1",
          title: "Lab Exercise 3: Control Structures & Loops",
          description: "Submit your source code (.java / .py) and 1 printed copy of the output flowcharts.",
          due_at: "2026-10-02T23:59:00+08:00",
          priority: "high"
        }
      },
      {
        type: "announcement",
        source_text: "Bring printed copy of lab sheet.",
        data: {
          title: "Submission Requirement for IT 112 Lab",
          content: "Please ensure your code has comments and includes your section BSIT 1-1 at the top header.",
          priority: "normal"
        }
      },
      {
        type: "event",
        source_text: "Quiz sa intro to computing on Monday.",
        data: {
          title: "IT 111 Quiz #1 (Computer Architecture Basics)",
          description: "Covers CPU cycles, memory hierarchy, and binary conversions.",
          starts_at: "2026-10-05T09:00:00+08:00",
          ends_at: "2026-10-05T10:00:00+08:00",
          location: "IT Building Room 201"
        }
      }
    ]
  },
  null,
  2
);

export const SAMPLE_BATCH_INVALID_DEMO = JSON.stringify(
  {
    version: "1.0",
    items: [
      {
        type: "assignment",
        data: {
          // Missing 'subject' (required field)
          title: "Invalid Item Demo",
          description: "This item lacks a subject field.",
          due_at: "invalid-date",
          priority: "critical" // invalid enum
        }
      },
      {
        type: "unsupported_type",
        data: {
          title: "Unknown type demonstration"
        }
      }
    ]
  },
  null,
  2
);
