-- CreateTable
CREATE TABLE "JournalPromptCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#8b5cf6',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JournalPromptCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalPrompt" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JournalPrompt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JournalPromptCategory_name_key" ON "JournalPromptCategory"("name");

-- CreateIndex
CREATE INDEX "JournalPrompt_categoryId_idx" ON "JournalPrompt"("categoryId");

-- AddForeignKey
ALTER TABLE "JournalPrompt" ADD CONSTRAINT "JournalPrompt_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "JournalPromptCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed default categories and prompts
INSERT INTO "JournalPromptCategory" ("id", "name", "color", "isActive", "sortOrder", "createdAt", "updatedAt") VALUES
  ('cat-reflection', 'Reflection', '#8b5cf6', true, 0, NOW(), NOW()),
  ('cat-gratitude', 'Gratitude', '#22c55e', true, 1, NOW(), NOW()),
  ('cat-leadership', 'Leadership', '#eab308', true, 2, NOW(), NOW()),
  ('cat-growth', 'Growth', '#3b82f6', true, 3, NOW(), NOW()),
  ('cat-challenge', 'Challenge', '#ef4444', true, 4, NOW(), NOW());

INSERT INTO "JournalPrompt" ("id", "text", "categoryId", "isActive", "sortOrder", "createdAt", "updatedAt") VALUES
  (gen_random_uuid()::text, 'What was the most meaningful conversation you had this week?', 'cat-reflection', true, 0, NOW(), NOW()),
  (gen_random_uuid()::text, 'What assumption did you challenge today?', 'cat-reflection', true, 1, NOW(), NOW()),
  (gen_random_uuid()::text, 'What moment today made you pause and think?', 'cat-reflection', true, 2, NOW(), NOW()),
  (gen_random_uuid()::text, 'How has your perspective changed on something recently?', 'cat-reflection', true, 3, NOW(), NOW()),
  (gen_random_uuid()::text, 'What did you learn about yourself this week?', 'cat-reflection', true, 4, NOW(), NOW()),
  (gen_random_uuid()::text, 'What would you do differently if you could redo today?', 'cat-reflection', true, 5, NOW(), NOW()),
  (gen_random_uuid()::text, 'Name three things you are grateful for today.', 'cat-gratitude', true, 0, NOW(), NOW()),
  (gen_random_uuid()::text, 'Who made a positive impact on you recently?', 'cat-gratitude', true, 1, NOW(), NOW()),
  (gen_random_uuid()::text, 'What small moment brought you joy today?', 'cat-gratitude', true, 2, NOW(), NOW()),
  (gen_random_uuid()::text, 'What resource or tool are you thankful to have access to?', 'cat-gratitude', true, 3, NOW(), NOW()),
  (gen_random_uuid()::text, 'What is something about your work environment you appreciate?', 'cat-gratitude', true, 4, NOW(), NOW()),
  (gen_random_uuid()::text, 'Who is someone you have not thanked yet but should?', 'cat-gratitude', true, 5, NOW(), NOW()),
  (gen_random_uuid()::text, 'How did you empower someone on your team today?', 'cat-leadership', true, 0, NOW(), NOW()),
  (gen_random_uuid()::text, 'What leadership quality do you most want to develop?', 'cat-leadership', true, 1, NOW(), NOW()),
  (gen_random_uuid()::text, 'Describe a decision you made today and how you arrived at it.', 'cat-leadership', true, 2, NOW(), NOW()),
  (gen_random_uuid()::text, 'How did you handle a disagreement or conflict recently?', 'cat-leadership', true, 3, NOW(), NOW()),
  (gen_random_uuid()::text, 'What is one thing you could delegate to help your team grow?', 'cat-leadership', true, 4, NOW(), NOW()),
  (gen_random_uuid()::text, 'How do you ensure every team member feels heard?', 'cat-leadership', true, 5, NOW(), NOW()),
  (gen_random_uuid()::text, 'What skill are you currently working to improve?', 'cat-growth', true, 0, NOW(), NOW()),
  (gen_random_uuid()::text, 'What feedback have you received that changed your perspective?', 'cat-growth', true, 1, NOW(), NOW()),
  (gen_random_uuid()::text, 'What book, article, or talk inspired you recently?', 'cat-growth', true, 2, NOW(), NOW()),
  (gen_random_uuid()::text, 'What is one habit you want to build this month?', 'cat-growth', true, 3, NOW(), NOW()),
  (gen_random_uuid()::text, 'Where are you today compared to where you were a year ago?', 'cat-growth', true, 4, NOW(), NOW()),
  (gen_random_uuid()::text, 'What is the next milestone you are working toward?', 'cat-growth', true, 5, NOW(), NOW()),
  (gen_random_uuid()::text, 'What is the biggest obstacle you are facing right now?', 'cat-challenge', true, 0, NOW(), NOW()),
  (gen_random_uuid()::text, 'Describe a recent failure and what you learned from it.', 'cat-challenge', true, 1, NOW(), NOW()),
  (gen_random_uuid()::text, 'What situation is currently outside your comfort zone?', 'cat-challenge', true, 2, NOW(), NOW()),
  (gen_random_uuid()::text, 'What problem have you been avoiding, and why?', 'cat-challenge', true, 3, NOW(), NOW()),
  (gen_random_uuid()::text, 'How do you stay motivated when progress feels slow?', 'cat-challenge', true, 4, NOW(), NOW()),
  (gen_random_uuid()::text, 'What is a risk you are considering taking, and what holds you back?', 'cat-challenge', true, 5, NOW(), NOW());
