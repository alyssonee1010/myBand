CREATE TABLE "GroupJoinLink" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "createdById" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupJoinLink_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GroupJoinLink_token_key" ON "GroupJoinLink"("token");
CREATE UNIQUE INDEX "GroupJoinLink_groupId_key" ON "GroupJoinLink"("groupId");
CREATE INDEX "GroupJoinLink_createdById_idx" ON "GroupJoinLink"("createdById");

ALTER TABLE "GroupJoinLink"
ADD CONSTRAINT "GroupJoinLink_groupId_fkey"
FOREIGN KEY ("groupId") REFERENCES "Group"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "GroupJoinLink"
ADD CONSTRAINT "GroupJoinLink_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
