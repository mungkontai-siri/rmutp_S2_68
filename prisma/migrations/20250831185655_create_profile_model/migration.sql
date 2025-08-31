-- CreateTable
CREATE TABLE "public"."Profile" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "mobile" VARCHAR(10) NOT NULL,
    "cardId" VARCHAR(13) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_username_key" ON "public"."Profile"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_mobile_key" ON "public"."Profile"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_cardId_key" ON "public"."Profile"("cardId");
