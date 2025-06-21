import { PrismaClient, Prisma } from "@prisma/client";
// Adding bulk itemized helper import
import { BulkItemizedResponse, itemized } from "../bulk-operations";

/**
 * Generic extension that adds a client‐level method `updateAndVerifyMany`.
 *
 * You can call it on any model delegate (for example, `prisma.user`,
 * `prisma.post`, `prisma.linkedIn_Profile`, etc.). Simply pass in:
 *
 * 1) The model’s delegate (for example: `prisma.linkedIn_Profile`)
 * 2) A `whereFilter` to select the rows you want to update
 * 3) The `data` object to apply in `updateMany`
 * 4) A function `(ids: string[]) => PrismaWhereInput` that builds a “verify” filter
 *    checking which rows actually ended up with the new data
 *
 * It returns `{ updatedIds, missingIds }`, where:
 * - `updatedIds` is the array of IDs that truly got updated
 * - `missingIds` is the array of IDs that either didn’t exist or did not end up with the expected post‐update state
 */
export const updateAndVerifyMany = Prisma.defineExtension({
  name: "UpdateAndVerifyMany",
  client: {
    async updateAndVerifyMany<
      Delegate extends {
        findMany(args: any): Promise<{ id: string }[]>;
        updateMany(args: any): Promise<{ count: number }>;
      },
    >(
      this: PrismaClient,
      modelDelegate: Delegate,
      whereFilter: Parameters<Delegate["findMany"]>[0]["where"],
      updateData: Parameters<Delegate["updateMany"]>[0]["data"],
      buildVerifyFilter: (ids: string[]) => object
    ): Promise<BulkItemizedResponse<string, void>> {
      // Step 1: Fetch all IDs matching the original filter
      const found = await modelDelegate.findMany({
        where: whereFilter,
        select: { id: true },
      } as any);
      const ids = found.map((row) => row.id);

      // Step 2: Perform update and verify using bulk itemized operation
      const response = await itemized<string, void>(
        ids,
        async (idsBatch, success, fail) => {
          // Update batch
          await modelDelegate.updateMany({
            where: { id: { in: idsBatch } },
            data: updateData,
          } as any);
          // Verify updated records
          const verifyWhere = buildVerifyFilter(idsBatch);
          const updatedRows = await modelDelegate.findMany({
            where: verifyWhere,
            select: { id: true },
          } as any);
          const updatedSet = new Set(updatedRows.map((row) => row.id));
          for (const id of idsBatch) {
            if (updatedSet.has(id)) {
              success(id);
            } else {
              fail(id);
            }
          }
        }
      );

      return response;
    },
  },
});
