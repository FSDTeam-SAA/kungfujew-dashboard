import { areaForPath, canAccess, isStaffRole, landingForRole } from "./access";

describe("dashboard role access", () => {
  it.each([
    ["admin", true, true, true],
    ["operations_manager", true, false, false],
    ["story_manager", false, true, false],
    ["customer", false, false, false],
    ["businessowner", false, false, false],
    ["unknown", false, false, false],
  ])(
    "applies the backend capability matrix to %s",
    (role, operations, stories, users) => {
      expect(canAccess(role, "operations")).toBe(operations);
      expect(canAccess(role, "stories")).toBe(stories);
      expect(canAccess(role, "users")).toBe(users);
    },
  );

  it("protects nested deep links by area", () => {
    expect(areaForPath("/dashboard/orders/CCG-100")).toBe("operations");
    expect(areaForPath("/dashboard/stories/new")).toBe("stories");
    expect(areaForPath("/dashboard/users/123")).toBe("users");
    expect(areaForPath("/dashboard/pricing")).toBeNull();
  });

  it("sends story managers to stories and rejects nonstaff roles", () => {
    expect(landingForRole("story_manager")).toBe("/dashboard/stories");
    expect(landingForRole("operations_manager")).toBe("/dashboard");
    expect(isStaffRole("customer")).toBe(false);
  });
});
