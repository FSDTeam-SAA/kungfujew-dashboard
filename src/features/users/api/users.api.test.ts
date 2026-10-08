import { api } from "@/lib/api";
import { updateUser } from "./users.api";
import type { UserFormValues } from "../schema";

jest.mock("@/lib/api", () => ({ api: { patch: jest.fn() } }));

it("keeps the password out of generic account edits", async () => {
  const values: UserFormValues = {
    fullName: "Alex",
    email: "alex@example.com",
    phoneNumber: "",
    role: "story_manager",
    status: "ACTIVE",
    password: "unused-secret",
  };
  jest.mocked(api.patch).mockResolvedValue({
    data: {
      statusCode: 200,
      message: "Success",
      data: { _id: "account-id", ...values },
    },
  });
  await updateUser("account-id", values);
  expect(api.patch).toHaveBeenCalledWith("/user/account-id", {
    fullName: "Alex",
    email: "alex@example.com",
    phoneNumber: "",
    role: "story_manager",
    status: "ACTIVE",
  });
});
