import { accountSchema, userFormSchema } from "./schema";

const account = {
  _id: "account-id",
  fullName: "Alex",
  email: "alex@example.com",
  status: "ACTIVE",
};

describe("staff account roles", () => {
  it.each([undefined, ""])("requires an explicit role (%s)", (role) => {
    const result = userFormSchema.safeParse({
      ...account,
      phoneNumber: "",
      password: "",
      role,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.role).toContain(
        "Select a staff role",
      );
    }
  });

  it.each(["admin", "operations_manager", "story_manager"])(
    "allows %s in the account form",
    (role) => {
      expect(
        userFormSchema.safeParse({
          ...account,
          phoneNumber: "",
          password: "",
          role,
        }).success,
      ).toBe(true);
    },
  );

  it.each(["customer", "businessowner"])(
    "reads backend %s accounts without allowing staff account creation",
    (role) => {
      expect(accountSchema.safeParse({ ...account, role }).success).toBe(true);
      expect(
        userFormSchema.safeParse({
          ...account,
          phoneNumber: "",
          password: "",
          role,
        }).success,
      ).toBe(false);
    },
  );
});
