-- CreateTable
CREATE TABLE "AssessmentQuestion" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "dimension" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentQuestion_questionId_key" ON "AssessmentQuestion"("questionId");

-- CreateIndex
CREATE INDEX "AssessmentQuestion_dimension_idx" ON "AssessmentQuestion"("dimension");

-- Seed default GROWTH questions
INSERT INTO "AssessmentQuestion" ("id", "questionId", "dimension", "text", "sortOrder", "updatedAt") VALUES
  (gen_random_uuid(), 'G1', 'G', 'I actively seek out new learning opportunities.', 1, NOW()),
  (gen_random_uuid(), 'G2', 'G', 'I embrace challenges as chances to grow.', 2, NOW()),
  (gen_random_uuid(), 'G3', 'G', 'I am open to feedback, even when it is critical.', 3, NOW()),
  (gen_random_uuid(), 'G4', 'G', 'I regularly reflect on my development progress.', 4, NOW()),
  (gen_random_uuid(), 'G5', 'G', 'I believe my abilities can be developed through effort.', 5, NOW()),
  (gen_random_uuid(), 'R1', 'R', 'I have consistent daily routines that support my goals.', 6, NOW()),
  (gen_random_uuid(), 'R2', 'R', 'I prioritize my most important tasks each day.', 7, NOW()),
  (gen_random_uuid(), 'R3', 'R', 'I maintain a regular schedule for learning and development.', 8, NOW()),
  (gen_random_uuid(), 'R4', 'R', 'I review and adjust my habits periodically.', 9, NOW()),
  (gen_random_uuid(), 'R5', 'R', 'I protect time for deep, focused work.', 10, NOW()),
  (gen_random_uuid(), 'O1', 'O', 'I take full responsibility for my results.', 11, NOW()),
  (gen_random_uuid(), 'O2', 'O', 'I proactively identify and solve problems.', 12, NOW()),
  (gen_random_uuid(), 'O3', 'O', 'I follow through on my commitments.', 13, NOW()),
  (gen_random_uuid(), 'O4', 'O', 'I hold myself accountable without external pressure.', 14, NOW()),
  (gen_random_uuid(), 'O5', 'O', 'I take initiative rather than waiting to be told what to do.', 15, NOW()),
  (gen_random_uuid(), 'W1', 'W', 'I persist through setbacks without losing motivation.', 16, NOW()),
  (gen_random_uuid(), 'W2', 'W', 'I manage stress effectively in challenging situations.', 17, NOW()),
  (gen_random_uuid(), 'W3', 'W', 'I can delay gratification for long-term goals.', 18, NOW()),
  (gen_random_uuid(), 'W4', 'W', 'I recover quickly from failures or disappointments.', 19, NOW()),
  (gen_random_uuid(), 'W5', 'W', 'I maintain focus even when tasks are difficult or boring.', 20, NOW()),
  (gen_random_uuid(), 'T1', 'T', 'I communicate clearly and listen actively.', 21, NOW()),
  (gen_random_uuid(), 'T2', 'T', 'I build trust with colleagues through consistent actions.', 22, NOW()),
  (gen_random_uuid(), 'T3', 'T', 'I contribute to a positive team culture.', 23, NOW()),
  (gen_random_uuid(), 'T4', 'T', 'I resolve conflicts constructively.', 24, NOW()),
  (gen_random_uuid(), 'T5', 'T', 'I support others'' growth and celebrate their successes.', 25, NOW()),
  (gen_random_uuid(), 'H1', 'H', 'I maintain a healthy work-life balance.', 26, NOW()),
  (gen_random_uuid(), 'H2', 'H', 'I take care of my physical health regularly.', 27, NOW()),
  (gen_random_uuid(), 'H3', 'H', 'I nurture meaningful personal relationships.', 28, NOW()),
  (gen_random_uuid(), 'H4', 'H', 'I make time for activities that recharge me.', 29, NOW()),
  (gen_random_uuid(), 'H5', 'H', 'I feel aligned between my work and personal values.', 30, NOW());
