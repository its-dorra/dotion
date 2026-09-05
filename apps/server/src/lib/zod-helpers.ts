import z from "zod";

export function zodList<T extends z.ZodType>(obj: T) {
  return z.array(obj);
}

export function zodSuccessResponse(): z.ZodObject<{
  success: z.ZodLiteral<true>;
}>;

export function zodSuccessResponse<T extends z.ZodType>(
  obj: T,
): z.ZodObject<{
  success: z.ZodLiteral<true>;
  data: T;
}>;

export function zodSuccessResponse<T extends z.ZodType>(obj?: T) {
  return z.object({
    success: z.literal(true),
    ...(obj ? { data: obj } : {}),
  });
}
