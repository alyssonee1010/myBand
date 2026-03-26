WITH duplicate_items AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "setlistId", "contentId"
      ORDER BY "position" ASC, "id" ASC
    ) AS row_number
  FROM "SetlistItem"
)
DELETE FROM "SetlistItem"
WHERE "id" IN (
  SELECT "id"
  FROM duplicate_items
  WHERE row_number > 1
);

CREATE UNIQUE INDEX "SetlistItem_setlistId_contentId_key" ON "SetlistItem"("setlistId", "contentId");
