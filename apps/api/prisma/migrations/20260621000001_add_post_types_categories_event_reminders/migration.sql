-- CreateEnum
CREATE TYPE "PostType" AS ENUM ('DISCUSSION', 'QUESTION', 'ANNOUNCEMENT', 'INTRODUCTION');

-- AlterTable: Post — add type column
ALTER TABLE "Post" ADD COLUMN "type" "PostType" NOT NULL DEFAULT 'DISCUSSION';
CREATE INDEX "Post_type_idx" ON "Post"("type");

-- AlterTable: Event — add reminder tracking
ALTER TABLE "Event" ADD COLUMN "reminder24hSent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Event" ADD COLUMN "reminder1hSent" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: User — add eventReminders preference
ALTER TABLE "User" ADD COLUMN "eventReminders" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable: Category
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateTable: PostCategory (join)
CREATE TABLE "PostCategory" (
    "postId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "PostCategory_pkey" PRIMARY KEY ("postId","categoryId")
);

ALTER TABLE "PostCategory" ADD CONSTRAINT "PostCategory_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PostCategory" ADD CONSTRAINT "PostCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: CourseCategory (join)
CREATE TABLE "CourseCategory" (
    "courseId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "CourseCategory_pkey" PRIMARY KEY ("courseId","categoryId")
);

ALTER TABLE "CourseCategory" ADD CONSTRAINT "CourseCategory_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CourseCategory" ADD CONSTRAINT "CourseCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: EventCategory (join)
CREATE TABLE "EventCategory" (
    "eventId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "EventCategory_pkey" PRIMARY KEY ("eventId","categoryId")
);

ALTER TABLE "EventCategory" ADD CONSTRAINT "EventCategory_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventCategory" ADD CONSTRAINT "EventCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed default categories
INSERT INTO "Category" ("id", "name", "slug", "icon", "color", "sortOrder", "createdAt", "updatedAt") VALUES
  ('cat_growth',       'Growth',       'growth',       '📈', '#22c55e', 1, NOW(), NOW()),
  ('cat_rhythms',      'Rhythms',      'rhythms',      '🔄', '#8b5cf6', 2, NOW(), NOW()),
  ('cat_empowerment',  'Empowerment',  'empowerment',  '💪', '#f59e0b', 3, NOW(), NOW()),
  ('cat_impact',       'Impact',       'impact',       '🎯', '#ef4444', 4, NOW(), NOW()),
  ('cat_teams',        'Teams',        'teams',        '👥', '#3b82f6', 5, NOW(), NOW()),
  ('cat_balance',      'Balance',      'balance',      '⚖️', '#14b8a6', 6, NOW(), NOW()),
  ('cat_ai',           'AI',           'ai',           '🤖', '#6366f1', 7, NOW(), NOW()),
  ('cat_other',        'Other',        'other',        '📌', '#6b7280', 8, NOW(), NOW());
